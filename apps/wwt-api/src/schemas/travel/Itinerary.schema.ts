import { Schema } from 'mongoose';

const ItinerarySchema = new Schema(
  {
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'TravelPackage',
      required: true,
    },

    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: 'itineraries' },
);

ItinerarySchema.index({ packageId: 1 });
ItinerarySchema.index({ packageId: 1, dayNumber: 1 }, { unique: true });

export default ItinerarySchema;
