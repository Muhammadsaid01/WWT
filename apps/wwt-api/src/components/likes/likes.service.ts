import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from '../../libs/dto/community/like';

@Injectable()
export class LikesService {
  constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}
}
