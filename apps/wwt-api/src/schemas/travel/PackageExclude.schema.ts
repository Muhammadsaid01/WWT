import { Schema } from 'mongoose';

const PackageExcludeSchema = new Schema(
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
  { timestamps: true, collection: 'packageExcludes' },
);

PackageExcludeSchema.index({ packageId: 1 });

export default PackageExcludeSchema;
