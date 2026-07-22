import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    heldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

walletSchema.virtual("availableBalance").get(function () {
  return this.balance - this.heldBalance;
});

walletSchema.set("toJSON", { virtuals: true });
walletSchema.set("toObject", { virtuals: true });

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
