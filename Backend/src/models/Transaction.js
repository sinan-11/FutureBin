import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "TOPUP",
        "RESERVE",
        "EXTRA_RESERVE",
        "RELEASE",
        "PICKUP_PAYMENT",
        "CANCELLATION_FEE",
        "TRANSFER",
        "WITHDRAWAL",
        "REFUND",
      ],
      required: true,
    },

    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    pickupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PickupRequest",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["wallet", "razorpay", "cash"],
      default: "wallet",
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    reference: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    failureReason: {
      type: String,
      default: null,
    },

    balanceBefore: {
      type: Number,
      default: null,
    },

    balanceAfter: {
      type: Number,
      default: null,
    },

    heldBefore: {
      type: Number,
      default: null,
    },

    heldAfter: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });
transactionSchema.index({ pickupId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ razorpayOrderId: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
