import { Schema } from 'mongoose';
import { ReportStatus, ReportTargetType, ReportType } from '../../libs/enums/report.enum';

const ReportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    targetType: {
      type: String,
      enum: ReportTargetType,
      required: true,
    },

    reportType: {
      type: String,
      enum: ReportType,
      required: true,
    },

    reportDesc: {
      type: String,
      default: null,
      trim: true,
    },

    reportStatus: {
      type: String,
      enum: ReportStatus,
      default: ReportStatus.PENDING,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    adminNote: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'reports',
  },
);

ReportSchema.index(
  {
    reporterId: 1,
    targetId: 1,
    targetType: 1,
  },
  {
    unique: true,
  },
);

ReportSchema.index({
  reportStatus: 1,
  createdAt: -1,
});

ReportSchema.index({
  targetType: 1,
  targetId: 1,
});

export default ReportSchema;
