import express from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  verifyEmail,
  resendOtp,
  login,
  forgotPasswordHandler,
  resetPasswordHandler,
  refresh,
  logout,
} from "../controllers/authController.js";

import upload from "../middlewares/upload.js";

const router = express.Router();

// ───────────────── Rate Limiters ─────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests, please try again later",
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

// ───────────────── Authentication ─────────────────

// Register
router.post(
  "/register",
  authLimiter,
  upload.fields([
    {
      name: "vehiclePhoto",
      maxCount: 1,
    },
    {
      name: "idProof",
      maxCount: 1,
    },
  ]),
  register
);

// Email Verification
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-otp", resendOtpLimiter, resendOtp);

// Login
router.post("/login", authLimiter, login);

// ───────────────── Password Reset ─────────────────

router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordHandler
);

router.post(
  "/reset-password",
  authLimiter,
  resetPasswordHandler
);

// ───────────────── Token ─────────────────

router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);

export default router;