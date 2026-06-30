import { Schema } from 'mongoose';

const PackageIncludeSchema = new Schema(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'TravelPackage',
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: 'packageIncludes' },
);

PackageIncludeSchema.index({ packageId: 1 });

export default PackageIncludeSchema;
