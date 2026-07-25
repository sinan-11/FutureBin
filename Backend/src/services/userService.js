import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";

import {
  sendVerificationOtp,
  sendWelcomeEmail,
  sendCollectorRegistrationAlert,
  sendCollectorApprovedEmail,
  sendCollectorRejectedEmail,
  sendPasswordResetOtp,
} from "../utils/sendEmail.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOtp = () =>
  crypto.randomInt(100000, 999999).toString();

const OTP_EXPIRY_MINUTES = 10;

// ─── Register User ────────────────────────────────────────────────────────────

export const registerUser = async (data) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    vehicleNumber,
    idProof,
    vehiclePhoto,
  } = data;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const allowedRoles = ["resident", "collector"];

  if (role && !allowedRoles.includes(role)) {
    throw new Error("Invalid role");
  }

  if (role === "collector") {
    if (!phone || !vehicleNumber) {
      throw new Error(
        "Phone and vehicle number are required for collectors"
      );
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const otp = generateOtp();
  const otpExpiry = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    verificationOtp: otp,
    verificationOtpExpires: otpExpiry,
    collectorDetails:
      role === "collector"
        ? { phone, vehicleNumber, idProof, vehiclePhoto }
        : undefined,
  });

  // Send verification OTP to user
  await sendVerificationOtp(email, otp);

  // Notify admin about new collector registration
  if (role === "collector") {
    await sendCollectorRegistrationAlert(
      process.env.ADMIN_EMAIL,
      name
    );
  }

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  delete userResponse.verificationOtp;
  delete userResponse.verificationOtpExpires;

  return {
    user: userResponse,
    message:
      role === "collector"
        ? "Registration successful. Please verify your email. Await admin approval after verification."
        : "Registration successful. Please verify your email to continue.",
  };
};

// ─── Verify Email OTP ─────────────────────────────────────────────────────────

export const verifyEmailOtp = async (email, otp) => {
  const user = await User.findOne({ email }).select(
    "+verificationOtp +verificationOtpExpires"
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  if (!user.verificationOtp || !user.verificationOtpExpires) {
    throw new Error("No OTP found. Please request a new one");
  }

  if (user.verificationOtpExpires < new Date()) {
    throw new Error("OTP has expired. Please request a new one");
  }

  if (user.verificationOtp !== otp) {
    throw new Error("Invalid OTP");
  }

  user.emailVerified = true;
  user.verificationOtp = null;
  user.verificationOtpExpires = null;

  await user.save();

  // Send welcome email to residents only
  // Collectors still need admin approval before they can use the app
  if (user.role === "resident") {
    await sendWelcomeEmail(email, user.name);
  }

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return {
    user: userResponse,
    message:
      user.role === "collector"
        ? "Email verified. Your account is awaiting admin approval."
        : "Email verified successfully. You can now log in.",
  };
};

// ─── Resend Verification OTP ──────────────────────────────────────────────────

export const resendVerificationOtp = async (email) => {
  const user = await User.findOne({ email }).select(
    "+verificationOtp +verificationOtpExpires"
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  const otp = generateOtp();
  const otpExpiry = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  user.verificationOtp = otp;
  user.verificationOtpExpires = otpExpiry;

  await user.save();

  await sendVerificationOtp(email, otp);

  return {
    message: "A new OTP has been sent to your email",
  };
};

// ─── Login User ───────────────────────────────────────────────────────────────

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in");
  }

  if (user.role === "collector" && !user.isApproved) {
    throw new Error("Your account is pending admin approval");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;

  await user.save();

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
};

// ─── Refresh Access Token ─────────────────────────────────────────────────────

export const refreshAccessToken = async (incomingToken) => {
  if (!incomingToken) {
    throw new Error("No refresh token provided");
  }

  let decoded;

  try {
    decoded = jwt.verify(
      incomingToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user || user.refreshToken !== incomingToken) {
    throw new Error("Please login again");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;

  await user.save();

  return { accessToken, refreshToken };
};

// ─── Logout User ──────────────────────────────────────────────────────────────

export const logoutUser = async (incomingToken) => {
  if (!incomingToken) return;

  let decoded;

  try {
    decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return;
  }

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (user && user.refreshToken === incomingToken) {
    user.refreshToken = null;
    await user.save();
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return {
      message:
        "If an account with that email exists, an OTP has been sent",
    };
  }

  const otp = generateOtp();
  const otpExpiry = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpires = otpExpiry;

  await user.save();

  await sendPasswordResetOtp(email, otp);

  return {
    message:
      "If an account with that email exists, an OTP has been sent",
  };
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email }).select(
    "+resetPasswordOtp +resetPasswordOtpExpires"
  );

  if (!user) {
    throw new Error("Invalid request");
  }

  if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
    throw new Error("No password reset was requested");
  }

  if (user.resetPasswordOtpExpires < new Date()) {
    throw new Error("OTP has expired. Please request a new one");
  }

  if (user.resetPasswordOtp !== otp) {
    throw new Error("Invalid OTP");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  user.resetPasswordOtp = null;
  user.resetPasswordOtpExpires = null;

  // Invalidate all existing sessions
  user.refreshToken = null;

  await user.save();

  return {
    message:
      "Password reset successful. Please log in with your new password.",
  };
};

// ─── Get User By Id ───────────────────────────────────────────────────────────

export const getUserById = async (id) => {
  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// ─── Get All Users ────────────────────────────────────────────────────────────

export const getAllUsers = async () => {
  return await User.find().select("-password");
};

// ─── Approve Collector ────────────────────────────────────────────────────────

export const approveCollector = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "collector") {
    throw new Error("Only collector accounts can be approved");
  }

  if (user.isApproved) {
    throw new Error("Collector is already approved");
  }

  user.isApproved = true;

  await user.save();

  await sendCollectorApprovedEmail(user.email, user.name);

  return user;
};

// ─── Reject Collector ─────────────────────────────────────────────────────────

export const rejectCollector = async (id, reason) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "collector") {
    throw new Error("Only collector accounts can be rejected");
  }

  if (user.isApproved) {
    throw new Error(
      "Cannot reject an already approved collector"
    );
  }

  await sendCollectorRejectedEmail(user.email, user.name, reason);

  await User.findByIdAndDelete(id);

  return {
    message: "Collector rejected and account removed",
  };
};

// ─── Update Availability ──────────────────────────────────────────────────────

export const updateAvailability = async (id, status) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "collector") {
    throw new Error("Only collectors can update availability");
  }

  user.isAvailable = status;

  await user.save();

  return user;
};

// ─── Update Location ──────────────────────────────────────────────────────────

export const updateLocation = async (id, longitude, latitude) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "collector") {
    throw new Error("Only collectors can update location");
  }

  user.location = {
    type: "Point",
    coordinates: [longitude, latitude],
  };

  await user.save();

  return user;
};

// ─── Update Bank Details ──────────────────────────────────────────────────

export const updateBankDetails = async (id, bankDetails) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "collector") {
    throw new Error("Only collectors can update bank details");
  }

  user.bankDetails = {
    accountHolderName: bankDetails.accountHolderName || "",
    accountNumber: bankDetails.accountNumber || "",
    ifscCode: bankDetails.ifscCode || "",
    bankName: bankDetails.bankName || "",
  };

  await user.save();

  return user;
};
// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const residents = await User.countDocuments({
    role: "resident",
  });

  const approvedCollectors = await User.countDocuments({
    role: "collector",
    isApproved: true,
  });

  const pendingCollectors = await User.countDocuments({
    role: "collector",
    isApproved: false,
  });

  const pendingCollectorList = await User.find({
    role: "collector",
    isApproved: false,
  }).select("-password");

  const approvedCollectorList = await User.find({
    role: "collector",
    isApproved: true,
  }).select("-password");

  let subscriptionStats = null;
  try {
    const { getSubscriptionStats } = await import("./subscriptionService.js");
    subscriptionStats = await getSubscriptionStats();
  } catch {
    // subscription model may not exist yet during initial setup
  }

  return {
    residents,
    approvedCollectors,
    pendingCollectors,
    pendingCollectorList,
    approvedCollectorList,
    subscriptionStats,
  };
};