import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';

import { GoogleGenAI } from '@google/genai';
import { AIConversation } from '../../libs/dto/ai/ai-conversation';
import { AIMessage } from '../../libs/dto/ai/ai-message';
import { AIMessageRole } from '../../libs/enums/ai.enum';
import {
  PackageCategory,
  PackageLevel,
  PackageType,
  TransportType,
} from '../../libs/enums/package.enum';
import { TravelPackageService } from '../travel-package/travel-package.service';

// ============================================
// AI TRAVEL SEARCH TYPE
// ============================================

interface AITravelSearch {
  destination?: string;

  minPrice?: number;
  maxPrice?: number;

  days?: number;

  category?: string;
  packageType?: string;
  packageLevel?: string;
  transportType?: string;

  people?: number;
  minRating?: number;
}

interface AITravelSearchResult {
  search: AITravelSearch;

  inputTokens: number;
  outputTokens: number;
}

interface AIGeneratedResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

@Injectable()
export class AiService {
  private readonly gemini: GoogleGenAI | null;
  private readonly AI_SEARCH_HISTORY_LIMIT = 10;
  private readonly AI_CONVERSATION_HISTORY_LIMIT = 12;
  private readonly AI_HISTORY_MESSAGE_MAX_LENGTH = 1000;

  constructor(
    @InjectModel('AIConversation')
    private readonly aiConversationModel: Model<AIConversation>,

    @InjectModel('AIMessage')
    private readonly aiMessageModel: Model<AIMessage>,
    private readonly travelPackageService: TravelPackageService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;

    this.gemini = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  public isAvailable(): boolean {
    return this.gemini !== null;
  }

  private getGemini(): GoogleGenAI {
    if (!this.gemini) {
      throw new ServiceUnavailableException('AI Assistant is not configured on the server.');
    }
    return this.gemini;
  }

  // =========================================================
  // GET OR CREATE AI CONVERSATION
  // =========================================================

  public async getOrCreateConversation(memberId: ObjectId): Promise<AIConversation> {
    let conversation = await this.aiConversationModel.findOne({
      memberId,
    });

    if (!conversation) {
      conversation = await this.aiConversationModel.create({
        memberId,
      });
    }

    return conversation;
  }

  // =========================================================
  // GET AI MESSAGES
  // =========================================================

  public async getMessages(memberId: ObjectId): Promise<AIMessage[]> {
    const conversation = await this.getOrCreateConversation(memberId);

    const messages: AIMessage[] = await this.aiMessageModel
      .find({
        conversationId: conversation._id,
        memberId,
      })
      .sort({
        createdAt: 1,
      })
      .lean<AIMessage[]>();

    return messages;
  }

  // =========================================================
  // SAVE USER MESSAGE
  // =========================================================

  public async saveUserMessage(memberId: ObjectId, content: string): Promise<AIMessage> {
    if (!content?.trim()) {
      throw new BadRequestException('Message is required.');
    }

    const conversation = await this.getOrCreateConversation(memberId);

    const message = await this.aiMessageModel.create({
      conversationId: conversation._id,
      memberId,
      messageRole: AIMessageRole.USER,
      messageContent: content.trim(),
    });

    await this.aiConversationModel.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessage: message.messageContent,
        lastMessageAt: message.createdAt,
      },
    });

    return message;
  }

  // =========================================================
  // SAVE AI MESSAGE
  // =========================================================

  public async saveAIMessage(
    memberId: ObjectId,
    content: string,
    aiModel?: string,
    inputTokens: number = 0,
    outputTokens: number = 0,
  ): Promise<AIMessage> {
    if (!content?.trim()) {
      throw new BadRequestException('AI message is required.');
    }

    const conversation = await this.getOrCreateConversation(memberId);

    const message = await this.aiMessageModel.create({
      conversationId: conversation._id,
      memberId,

      messageRole: AIMessageRole.ASSISTANT,

      messageContent: content.trim(),

      aiModel: aiModel ?? null,

      inputTokens,
      outputTokens,
    });

    await this.aiConversationModel.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessage: message.messageContent,
        lastMessageAt: message.createdAt,
      },
    });

    return message;
  }

  // =========================================================
  // CLEAR AI CHAT / NEW CHAT
  // =========================================================

  public async clearChat(memberId: ObjectId): Promise<boolean> {
    const conversation = await this.aiConversationModel.findOne({
      memberId,
    });

    if (!conversation) {
      return true;
    }

    await this.aiMessageModel.deleteMany({
      conversationId: conversation._id,
      memberId,
    });

    await this.aiConversationModel.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessage: null,
        lastMessageAt: null,
      },
    });

    return true;
  }

  public async generateResponse(memberId: ObjectId): Promise<AIGeneratedResponse> {
    // =========================================================
    // GET CHAT HISTORY
    // =========================================================

    const messages = await this.getMessages(memberId);

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.messageRole === AIMessageRole.USER);

    if (!latestUserMessage) {
      throw new BadRequestException('User message was not found.');
    }

    const content = latestUserMessage.messageContent;

    // =========================================================
    // PREVIOUS HISTORY FOR SEARCH MEMORY
    // =========================================================

    const previousHistory = this.buildAIHistory(
      messages.slice(0, -1),
      this.AI_SEARCH_HISTORY_LIMIT,
    );

    // =========================================================
    // EXTRACT SEARCH FILTERS + PARSER TOKEN USAGE
    // =========================================================

    const searchResult = await this.extractTravelSearch(content, previousHistory);

    const search = searchResult.search;

    console.log('================ AI MEMORY ================');
    console.log(previousHistory);

    console.log('================ AI SEARCH ================');
    console.log(search);

    console.log('================ AI PARSER TOKENS ================');

    console.log({
      inputTokens: searchResult.inputTokens,
      outputTokens: searchResult.outputTokens,
    });

    // =========================================================
    // SEARCH REAL WWT PACKAGES
    // =========================================================

    const packages = await this.travelPackageService.searchPackagesForAI(
      search.destination,
      search.minPrice,
      search.maxPrice,
      search.days,
      search.category as PackageCategory | undefined,
      search.packageType as PackageType | undefined,
      search.packageLevel as PackageLevel | undefined,
      search.transportType as TransportType | undefined,
      search.people,
      search.minRating,
    );

    console.log('================ AI PACKAGES ================');
    console.log(packages);

    // =========================================================
    // REMOVE DUPLICATE PACKAGES
    // =========================================================

    const uniquePackages = packages.filter(
      (pkg, index, array) =>
        index ===
        array.findIndex(
          (item) =>
            item.packageTitle === pkg.packageTitle &&
            item.destinationCity === pkg.destinationCity &&
            item.packagePrice === pkg.packagePrice &&
            item.packageDays === pkg.packageDays,
        ),
    );

    console.log('================ UNIQUE AI PACKAGES ================');
    console.log(uniquePackages);

    // =========================================================
    // PACKAGE CONTEXT
    // =========================================================

    const packageContext = uniquePackages.map((pkg) => ({
      id: pkg._id.toString(),

      title: pkg.packageTitle,

      description: pkg.packageShortDesc ?? pkg.packageDesc,

      type: pkg.packageType,
      category: pkg.packageCategory,
      level: pkg.packageLevel,

      country: pkg.destinationCountry,
      city: pkg.destinationCity,

      price: pkg.packagePrice,
      currency: pkg.currency,

      days: pkg.packageDays,
      nights: pkg.packageNights,

      minPeople: pkg.minPeople,
      maxPeople: pkg.maxPeople,

      transportType: pkg.transportType,

      rating: pkg.packageRating,
      reviewCount: pkg.packageReviewCount,
    }));

    // =========================================================
    // FULL HISTORY FOR FINAL RESPONSE
    // =========================================================

    const history = this.buildAIHistory(messages, this.AI_CONVERSATION_HISTORY_LIMIT);

    // =========================================================
    // FINAL PROMPT
    // =========================================================

    const prompt = `
You are WWT AI, the official travel assistant of Wonder World Travel.

Your job is to help users:
- Find suitable WWT travel packages.
- Compare travel options.
- Understand destinations.
- Plan trips.
- Continue naturally from previous conversation context.

IMPORTANT RULES:

1. Reply in the same language as the user's latest message.

2. Be concise, friendly, clear, and helpful.

3. Never invent a WWT package.

4. Never invent a WWT package price.

5. Never invent availability, ratings, duration, transport, or package details.

6. If recommending a WWT package, use ONLY the packages inside WWT_PACKAGE_DATA.

7. If WWT_PACKAGE_DATA is empty:
   - Clearly tell the user that no matching WWT package was found.
   - You may still provide general travel advice separately.
   - Do NOT create a fake package.

8. Use previous conversation context for follow-up questions.

9. Prefer the best matching package based on:
   - destination
   - budget
   - duration
   - category
   - package level
   - transport
   - number of travelers
   - rating

10. If several packages match, briefly compare the strongest options.

CURRENT SEARCH FILTERS:
${JSON.stringify(search, null, 2)}

WWT_PACKAGE_DATA:
${JSON.stringify(packageContext, null, 2)}

CONVERSATION:
${history}

Answer the user's latest message.
`;

    // =========================================================
    // FINAL GEMINI RESPONSE
    // =========================================================

    const response = await this.getGemini().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim();

    if (!text) {
      throw new BadRequestException('AI did not return a response.');
    }

    // =========================================================
    // FINAL RESPONSE TOKENS
    // =========================================================

    const finalInputTokens = response.usageMetadata?.promptTokenCount ?? 0;

    const finalOutputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;

    // =========================================================
    // TOTAL TOKEN USAGE
    // parser + final response
    // =========================================================

    const inputTokens = searchResult.inputTokens + finalInputTokens;

    const outputTokens = searchResult.outputTokens + finalOutputTokens;

    const totalTokens = inputTokens + outputTokens;

    console.log('================ TOTAL AI TOKEN USAGE ================');

    console.log({
      parser: {
        inputTokens: searchResult.inputTokens,
        outputTokens: searchResult.outputTokens,
      },

      finalResponse: {
        inputTokens: finalInputTokens,
        outputTokens: finalOutputTokens,
      },

      total: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    });

    return {
      text,
      inputTokens,
      outputTokens,
      totalTokens,
    };
  }

  private async extractTravelSearch(
    content: string,
    history: string,
  ): Promise<AITravelSearchResult> {
    const prompt = `
You are a travel package search parameter extractor for WWT.

Analyze the conversation and the user's latest message.

IMPORTANT MEMORY RULES:

- Use previous conversation context when the latest message is a follow-up.
- Preserve previously specified filters unless the user changes them.
- If the user changes a filter, always use the newest value.
- If the latest message introduces a new filter, combine it with relevant previous filters.
- Do not preserve a previous filter if the user explicitly removes it.

Resolve references such as:
- "arzonrog'i"
- "4 kishi uchun-chi?"
- "5 kunlik bo'lsin"
- "luxury-chi?"
- "Busanga-chi?"
- "boshqa variant bormi?"

Return the final search parameters that should be used NOW.

PREVIOUS CONVERSATION:
${history}

LATEST USER MESSAGE:
${content}

Return ONLY valid JSON.
Do not use markdown.
Do not add explanations.

{
  "destination": null,
  "minPrice": null,
  "maxPrice": null,
  "days": null,
  "category": null,
  "packageType": null,
  "packageLevel": null,
  "transportType": null,
  "people": null,
  "minRating": null
}
`;

    // =========================================================
    // GEMINI PARSER
    // =========================================================

    const response = await this.getGemini().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim();

    // =========================================================
    // PARSER TOKEN USAGE
    // =========================================================

    const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;

    const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;

    if (!text) {
      return {
        search: {},
        inputTokens,
        outputTokens,
      };
    }

    try {
      const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      const search: AITravelSearch = {
        destination: parsed.destination ?? undefined,

        minPrice: typeof parsed.minPrice === 'number' ? parsed.minPrice : undefined,

        maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : undefined,

        days: typeof parsed.days === 'number' ? parsed.days : undefined,

        category: parsed.category ?? undefined,

        packageType: parsed.packageType ?? undefined,

        packageLevel: parsed.packageLevel ?? undefined,

        transportType: parsed.transportType ?? undefined,

        people: typeof parsed.people === 'number' ? parsed.people : undefined,

        minRating: typeof parsed.minRating === 'number' ? parsed.minRating : undefined,
      };

      return {
        search,
        inputTokens,
        outputTokens,
      };
    } catch (err) {
      console.log('AI SEARCH PARSE ERROR:', err);

      console.log('AI SEARCH RAW:', text);

      return {
        search: {},
        inputTokens,
        outputTokens,
      };
    }
  }

  private buildAIHistory(messages: AIMessage[], limit: number): string {
    return messages
      .slice(-limit)
      .map((message) => {
        const role = message.messageRole === AIMessageRole.USER ? 'USER' : 'ASSISTANT';

        const content =
          message.messageContent.length > this.AI_HISTORY_MESSAGE_MAX_LENGTH
            ? `${message.messageContent.slice(0, this.AI_HISTORY_MESSAGE_MAX_LENGTH)}...`
            : message.messageContent;

        return `${role}: ${content}`;
      })
      .join('\n');
  }
}
