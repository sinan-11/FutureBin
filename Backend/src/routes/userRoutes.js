import express from "express";

import {
  getMe,
  getUser,
  getUsers,
  dashboardStats,
  approveCollectorHandler,
  rejectCollectorHandler,
  setAvailability,
  setLocation,
  setBankDetails,
} from "../controllers/userController.js";

import {
  protect,
  authorize,
} from "../middlewares/auth.js";

const router = express.Router();

// ─── Current User ─────────────────────────────────────────────────────────────

router.get("/me", protect, getMe);

// ─── Collector Routes ─────────────────────────────────────────────────────────

router.patch(
  "/availability",
  protect,
  authorize("collector"),
  setAvailability
);

router.patch(
  "/location",
  protect,
  authorize("collector"),
  setLocation
);

router.patch(
  "/bank-details",
  protect,
  authorize("collector"),
  setBankDetails
);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// Dashboard Statistics
router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  dashboardStats
);

// Get All Users
router.get(
  "/",
  protect,
  authorize("admin"),
  getUsers
);

// Get User By ID
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getUser
);

// Approve Collector
router.patch(
  "/:id/approve",
  protect,
  authorize("admin"),
  approveCollectorHandler
);

// Reject Collector
router.patch(
  "/:id/reject",
  protect,
  authorize("admin"),
  rejectCollectorHandler
);

export default router;