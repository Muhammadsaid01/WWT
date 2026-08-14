import { BadRequestException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { createWriteStream } from 'fs';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';
import { ObjectId } from 'mongoose';
import {
  getSerialForImage,
  shapeIntoMongoObjectId,
  validateImage,
  validMimeTypes,
} from '../../libs/config';
import { Member, Members } from '../../libs/dto/member/member';
import { LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { MemberUpdate, MemberUpdateByAdmin } from '../../libs/dto/member/member.update';
import { Message } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { MemberService } from './member.service';

@Resolver()
export class MemberResolver {
  constructor(private readonly memberService: MemberService) {}
  //** MEMBER **/ //SignUp,
  @Mutation(() => Member)
  public async signup(@Args('input') input: MemberInput): Promise<Member> {
    console.log('Mutation signup');
    console.log('Input:', input);
    return this.memberService.signup(input);
  }
  //Login
  @Mutation(() => Member)
  public async login(@Args('input') input: LoginInput): Promise<Member> {
    console.log('Mutation login');
    console.log('Input:', input);
    return this.memberService.login(input);
  }

  //Checking Authenticated Member
  @UseGuards(AuthGuard)
  @Query(() => String)
  public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
    console.log('Query: checkAuth');
    console.log('memberNick:', memberNick);
    return `Hi, ${memberNick}`;
  }
  @Roles(MemberType.AGENT, MemberType.USER)
  @UseGuards(RolesGuard)
  @Query(() => String)
  public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
    console.log('Query: checkAuth');
    console.log('memberNick:', authMember.memberNick);
    return `Hi, ${authMember.memberNick} you are ${authMember.memberType}, and your role is authorized! your Id is ${authMember._id}`;
  }

  @UseGuards(WithoutGuard)
  @Query(() => Member)
  public async getMember(
    @Args('memberId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Member> {
    console.log('Query getMember');
    console.log('Input memberId:', memberId);
    const targetId = shapeIntoMongoObjectId(input);
    return this.memberService.getMember(memberId, targetId);
  }

  // Authenticated
  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async updateMember(
    @Args('input') input: MemberUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Member> {
    console.log('Mutation updateMember');
    delete input._id;
    console.log('Authenticated Member:', memberId);
    return this.memberService.updateMember(memberId, input);
  }

  @UseGuards(AuthGuard)
  @UseGuards(RolesGuard)
  @Query(() => Member)
  public async getMyProfile(@AuthMember('_id') memberId: ObjectId): Promise<Member> {
    console.log('Query getMyProfile');

    return this.memberService.getMyProfile(memberId);
  }

  @Roles(MemberType.USER, MemberType.AGENT, MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Member)
  public async deleteMember(@AuthMember('_id') memberId: ObjectId): Promise<Member> {
    console.log('Mutation deleteMember');

    return this.memberService.deleteMember(memberId);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Member)
  public async likeTargetMember(
    @Args('memberId', { type: () => String })
    targetMemberId: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Member> {
    console.log('Mutation: likeTargetMember');

    const targetId = shapeIntoMongoObjectId(targetMemberId);
    return this.memberService.likeTargetMember(memberId, targetId);
  }

  //** ADMIN **/

  // AUTHORIZED: Admin
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query(() => Members)
  public async getAllMembersByAdmin(
    @AuthMember() authMember: Member,
    @Args('input') input: MembersInquiry,
  ): Promise<Members> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Query getAllMembersByAdmin');

    return this.memberService.getAllMembersByAdmin(input);
  }
  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation(() => Member)
  public async updateMemberByAdmin(
    @AuthMember() authMember: Member,
    @Args('input') input: MemberUpdateByAdmin,
  ): Promise<Member> {
    console.log('Authenticated Admin:', authMember.memberType);
    console.log('Mutation updateMemberByAdmin');

    return this.memberService.updateMemberByAdmin(input);
  }

  // IMAGE UPLOADER

  // IMAGE UPLOADER

  @UseGuards(AuthGuard)
  @Mutation(() => String)
  public async imageUploader(
    @Args('file', { type: () => GraphQLUpload })
    file: FileUpload,

    @Args('target')
    target: string,
  ): Promise<string> {
    console.log('Mutation: imageUploader');

    const { createReadStream, filename, mimetype } = file;

    console.log('filename:', filename);
    console.log('mimetype:', mimetype);
    console.log('file:', file);

    const validImage = validateImage(filename, mimetype);

    if (!filename) {
      throw new Error(Message.UPLOAD_FAILED);
    }

    if (!validImage) {
      throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
    }
    const imageName = getSerialForImage(filename);

    const url = `uploads/${target}/${imageName}`;

    const stream = createReadStream();

    const result = await new Promise<boolean>((resolve, reject) => {
      stream
        .pipe(createWriteStream(url))
        .on('finish', () => resolve(true))
        .on('error', reject);
    });

    if (!result) {
      throw new Error(Message.UPLOAD_FAILED);
    }

    return url;
  }

  // IMAGES UPLOADER

  @UseGuards(AuthGuard)
  @Mutation(() => [String])
  public async imagesUploader(
    @Args('files', {
      type: () => [GraphQLUpload],
    })
    files: FileUpload[],

    @Args('target')
    target: string,
  ): Promise<string[]> {
    console.log('Mutation: imagesUploader');

    const uploadedImages: string[] = [];

    const promisedList = files.map(async (img: FileUpload, index: number): Promise<void> => {
      const { filename, mimetype, createReadStream } = img;

      if (!filename) {
        throw new Error(Message.UPLOAD_FAILED);
      }

      const validMime = validMimeTypes.includes(mimetype);

      if (!validMime) {
        throw new Error(Message.PROVIDE_ALLOWED_FORMAT);
      }

      const imageName = getSerialForImage(filename);

      const url = `uploads/${target}/${imageName}`;

      const stream = createReadStream();

      await new Promise<void>((resolve, reject) => {
        stream.pipe(createWriteStream(url)).on('finish', resolve).on('error', reject);
      });

      uploadedImages[index] = url;
    });

    await Promise.all(promisedList);

    return uploadedImages;
  }
}
