import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TravelPackageService {
  constructor(@InjectModel('TravelPackage') private readonly packageModel: Model<null>) {}
}
