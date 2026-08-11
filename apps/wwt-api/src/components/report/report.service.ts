import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel('Report')
    private readonly reportModel: Model<Report>,
  ) {}
}
