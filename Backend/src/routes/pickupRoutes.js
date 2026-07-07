import express from "express";

import {
  createRequest,
  acceptRequest,
  rejectRequest,
  arriveRequest,
  verifyWeightHandler,
  generateOtpHandler,
  getOtpHandler,
  verifyOtpHandler,
  getMyRequests,
  getAvailable,
  getAssignedRequests,
  updateStatus,
  cancelRequestHandler,
} from "../controllers/pickupController.js";

import {
  protect,
  authorize,
} from "../middlewares/auth.js";

const router = express.Router();

// ─── Resident Routes ──────────────────────────────────────────────────────────

router.post(
  "/",
  protect,
  authorize("resident"),
  createRequest
);

router.get(
  "/my",
  protect,
  authorize("resident"),
  getMyRequests
);

router.patch(
  "/:id/cancel",
  protect,
  authorize("resident"),
  cancelRequestHandler
);

router.get(
  "/:id/otp",
  protect,
  authorize("resident"),
  getOtpHandler
);

// ─── Collector Routes ─────────────────────────────────────────────────────────

router.get(
  "/available",
  protect,
  authorize("collector"),
  getAvailable
);

router.patch(
  "/:id/accept",
  protect,
  authorize("collector"),
  acceptRequest
);

router.patch(
  "/:id/reject",
  protect,
  authorize("collector"),
  rejectRequest
);

router.patch(
  "/:id/status",
  protect,
  authorize("collector"),
  updateStatus
);

router.get(
  "/assigned",
  protect,
  authorize("collector"),
  getAssignedRequests
);

router.patch(
  "/:id/arrive",
  protect,
  authorize("collector"),
  arriveRequest
);

router.patch(
  "/:id/verify-weight",
  protect,
  authorize("collector"),
  verifyWeightHandler
);

router.patch(
  "/:id/generate-otp",
  protect,
  authorize("collector"),
  generateOtpHandler
);

router.patch(
  "/:id/verify-otp",
  protect,
  authorize("collector"),
  verifyOtpHandler
);

export default router;
