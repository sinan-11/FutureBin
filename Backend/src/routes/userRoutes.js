import express from "express";

import {
  getMe,
  getUser,
  getUsers,
  approveCollectorHandler,
  setAvailability,
  setLocation,
} from "../controllers/userController.js";

import {
  protect,
  authorize,
} from "../middlewares/auth.js";

const router = express.Router();

// Current User
router.get(
  "/me",
  protect,
  getMe
);

// Collector Routes
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

// Admin Routes
router.get(
  "/",
  protect,
  authorize("admin"),
  getUsers
);

router.get(
  "/:id",
  protect,
  authorize("admin"),
  getUser
);

router.patch(
  "/:id/approve",
  protect,
  authorize("admin"),
  approveCollectorHandler
);

export default router;