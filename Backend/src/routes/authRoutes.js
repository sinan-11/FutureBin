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

const router = express.Router();

// ─── Rate Limiters ────────────────────────────────────────────────────────────

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

// ─── Authentication ───────────────────────────────────────────────────────────

router.post("/register", authLimiter, register);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-otp", resendOtpLimiter, resendOtp);
router.post("/login", authLimiter, login);

// ─── Password Reset ───────────────────────────────────────────────────────────

router.post("/forgot-password", authLimiter, forgotPasswordHandler);
router.post("/reset-password", authLimiter, resetPasswordHandler);

// ─── Token ────────────────────────────────────────────────────────────────────

router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);

export default router;