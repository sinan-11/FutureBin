import express from "express";
import rateLimit from "express-rate-limit";

import {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  chat,
  streamChat,
} from "../controllers/aiController.js";

import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// ─── Rate Limiters ───────────────────────────────────────────────────────────

const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

const aiConversationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// Create conversation
router.post(
  "/conversation",
  protect,
  authorize("resident", "collector", "admin"),
  aiConversationLimiter,
  createConversation
);

// List user's conversations
router.get(
  "/conversations",
  protect,
  authorize("resident", "collector", "admin"),
  listConversations
);

// Get messages of a conversation
router.get(
  "/conversation/:id",
  protect,
  authorize("resident", "collector", "admin"),
  getConversation
);

// Delete conversation
router.delete(
  "/conversation/:id",
  protect,
  authorize("resident", "collector", "admin"),
  deleteConversation
);

// Send a message (intent-based or non-streaming LLM)
router.post(
  "/chat",
  protect,
  authorize("resident", "collector", "admin"),
  aiChatLimiter,
  chat
);

// Send a message (streaming LLM with tool calling)
router.post(
  "/chat/stream",
  protect,
  authorize("resident", "collector", "admin"),
  aiChatLimiter,
  streamChat
);

export default router;
