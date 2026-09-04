import { Schema } from 'mongoose';

const PackageTagSchema = new Schema(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'TravelPackage',
      required: true,
    },

    tagName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true, collection: 'packageTags' },
);

PackageTagSchema.index({ packageId: 1 });
PackageTagSchema.index({ packageId: 1, tagName: 1 }, { unique: true });

export default PackageTagSchema;
