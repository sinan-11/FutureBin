import express from "express";

import {
  getChatMessages,
  sendChatMessage,
  markChatRead,
} from "../controllers/chatController.js";

import {
  protect,
  authorize,
} from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/:pickupId/messages",
  protect,
  authorize("resident", "collector"),
  getChatMessages
);

router.post(
  "/:pickupId/messages",
  protect,
  authorize("resident", "collector"),
  sendChatMessage
);

router.patch(
  "/:pickupId/read",
  protect,
  authorize("resident", "collector"),
  markChatRead
);

export default router;
