import { Schema } from 'mongoose';
import { ScheduleStatus } from '../../libs/enums/package.enum';

const PackageScheduleSchema = new Schema(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'TravelPackage',
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    scheduleStatus: {
      type: String,
      enum: ScheduleStatus,
      default: ScheduleStatus.OPEN,
    },
  },
  { timestamps: true, collection: 'packageSchedules' },
);

PackageScheduleSchema.index({ packageId: 1 });
PackageScheduleSchema.index({ startDate: 1 });
PackageScheduleSchema.index({ scheduleStatus: 1 });

export default PackageScheduleSchema;
