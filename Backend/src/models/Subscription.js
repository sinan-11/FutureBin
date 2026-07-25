import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    full: { type: String, default: "" },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    frequency: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true,
    },

    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
    },

    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },

    pickupTime: {
      type: String,
      required: true,
    },

    timezone: {
      type: String,
      required: true,
      default: "UTC",
    },

    wasteType: {
      type: String,
      enum: ["recyclable", "organic", "hazardous", "electronic", "general"],
      required: true,
    },

    estimatedWeight: {
      type: Number,
      required: true,
      min: 0,
    },

    address: {
      type: addressSchema,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    images: {
      type: [String],
      default: [],
    },

    paymentMethod: {
      type: String,
      enum: ["wallet", "cash"],
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
    },

    nextRunAt: {
      type: Date,
      required: true,
    },

    lastRunAt: {
      type: Date,
      default: null,
    },

    processingLock: {
      type: Boolean,
      default: false,
    },

    lockedAt: {
      type: Date,
      default: null,
    },

    lastPickupRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PickupRequest",
      default: null,
    },

    lastInsufficientNotifyAt: {
      type: Date,
      default: null,
    },

    lastSkippedActivePickupNotifyAt: {
      type: Date,
      default: null,
    },

    consecutiveFailures: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ nextRunAt: 1, status: 1, processingLock: 1 });
subscriptionSchema.index({ resident: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ location: "2dsphere" });

subscriptionSchema.index(
  {
    resident: 1,
    frequency: 1,
    dayOfWeek: 1,
    dayOfMonth: 1,
    wasteType: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
