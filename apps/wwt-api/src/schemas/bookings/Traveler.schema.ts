import { Schema } from 'mongoose';
import { TravelerGender } from '../../libs/enums/traveler.enum';

const TravelerSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: TravelerGender,
      required: true,
    },

    nationality: {
      type: String,
      required: true,
      trim: true,
    },

    passportNumber: {
      type: String,
      required: true,
      trim: true,
    },

    passportExpireDate: {
      type: Date,
      required: true,
    },

    travelerDeletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'travelers',
  },
);

TravelerSchema.index({ bookingId: 1 });
TravelerSchema.index({ passportNumber: 1 });

export default TravelerSchema;
