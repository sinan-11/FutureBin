import mongoose from "mongoose";

const pickupRequestSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    collector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    eligibleCollectors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    rejectedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    wasteType: {
      type: String,
      enum: [
        "recyclable",
        "organic",
        "hazardous",
        "electronic",
        "general",
      ],
      required: [true, "Waste type is required"],
    },

    estimatedWeight: {
      type: Number,
      required: [true, "Estimated weight is required"],
      min: [0, "Weight must be greater than 0"],
    },

    estimatedPrice: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    pickupAddress: {
      type: String,
      required: [true, "Pickup address is required"],
      trim: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number],
        required: [true, "Coordinates are required"],
      },
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "broadcasting",
        "accepted",
        "collector_arrived",
        "collecting",
        "weight_verified",
        "payment_pending",
        "paid",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "pending",
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    arrivedAt: {
      type: Date,
      default: null,
    },

    actualWeight: {
      type: Number,
      default: null,
    },

    finalPrice: {
      type: Number,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    completionOtp: {
      type: String,
      default: null,
    },

    completionOtpExpiresAt: {
      type: Date,
      default: null,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["wallet", "cash"],
      default: "wallet",
    },

    reservedAmount: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "reserved",
        "awaiting_extra_payment",
        "cash_pending",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    cashConfirmed: {
      type: Boolean,
      default: false,
    },

    extraPaymentOrderId: {
      type: String,
      default: null,
    },

    extraPaymentAmount: {
      type: Number,
      default: 0,
    },

    razorpayKeyId: {
      type: String,
      default: null,
    },

    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

pickupRequestSchema.index({ status: 1 });
pickupRequestSchema.index({ collector: 1 });
pickupRequestSchema.index({ resident: 1 });
pickupRequestSchema.index({ location: "2dsphere" });

const PickupRequest = mongoose.model(
  "PickupRequest",
  pickupRequestSchema
);

export default PickupRequest;
