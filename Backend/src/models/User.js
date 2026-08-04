import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic Details
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["resident", "collector", "admin"],
      default: "resident",
    },

    // Email Verification
    emailVerified: {
      type: Boolean,
      default: false,
    },

    verificationOtp: {
      type: String,
      default: null,
      select: false,
    },

    verificationOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Forgot Password
    resetPasswordOtp: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Collector Approval
    isApproved: {
      type: Boolean,
      default: function () {
        return this.role === "resident";
      },
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    // Collector Details
    collectorDetails: {
      phone: {
        type: String,
        required: function () {
          return this.role === "collector";
        },
      },

      vehicleNumber: {
        type: String,
        required: function () {
          return this.role === "collector";
        },
      },

      vehiclePhoto: {
        type: String,
        default: "",
      },

      idProof: {
        type: String,
        default: "",
      },
    },

    // Bank Details (for collector withdrawals)
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
    },

    // Refresh Token
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },

    // Rating
    averageRating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    ratingBreakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },

    // Collector Location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Geo Index
userSchema.index(
  {
    location: "2dsphere",
  },
  {
    sparse: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;