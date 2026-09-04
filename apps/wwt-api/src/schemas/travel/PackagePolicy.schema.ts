import { Schema } from 'mongoose';

const PackagePolicySchema = new Schema(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'TravelPackage',
      required: true,
      unique: true,
    },

    cancelPolicy: {
      type: String,
      required: true,
      trim: true,
    },

    refundPolicy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: 'packagePolicies' },
);

PackagePolicySchema.index({ packageId: 1 });

export default PackagePolicySchema;
