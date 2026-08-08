import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from '../../libs/dto/community/like';
import { LikeInput } from '../../libs/dto/community/like.input';
import { Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class LikesService {
  constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

  public async toggleLike(input: LikeInput): Promise<number> {
    const search: T = {
      memberId: input.memberId,
      targetId: input.targetId,
      targetType: input.targetType,
    };

    const existingLike = await this.likeModel.findOne(search).exec();

    let modifier = 1;

    if (existingLike) {
      await this.likeModel.findOneAndDelete(search).exec();

      modifier = -1;
    } else {
      try {
        await this.likeModel.create({
          memberId: input.memberId,
          targetId: input.targetId,
          targetType: input.targetType,
        });
      } catch (error) {
        console.log('ERROR, LikeService model:', error);

        throw new BadRequestException(Message.CREATE_FAILED);
      }
    }

    console.log(`- Like modifier ${modifier} -`);

    return modifier;
  }
}
