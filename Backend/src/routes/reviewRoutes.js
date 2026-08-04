import express from "express";

import {
  createReviewHandler,
  getPickupReviewsHandler,
  getUserReviewsHandler,
  getUserReviewSummaryHandler,
  getAllReviewsHandler,
  getPlatformStatsHandler,
  deleteReviewHandler,
} from "../controllers/reviewController.js";

import { validateCreateReview } from "../middlewares/validateReview.js";
import {
  protect,
  authorize,
} from "../middlewares/auth.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("resident", "collector"),
  (req, res, next) => {
    try {
      req.body = validateCreateReview(req.body, req.user.role);
      next();
    } catch (error) {
      const status = error.status || 400;
      res.status(status).json({ success: false, message: error.message });
    }
  },
  createReviewHandler
);

router.get(
  "/pickups/:pickupId",
  protect,
  getPickupReviewsHandler
);

router.get(
  "/users/:userId",
  getUserReviewsHandler
);

router.get(
  "/users/:userId/summary",
  getUserReviewSummaryHandler
);

export default router;
