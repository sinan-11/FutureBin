import express from "express";

import {
  getAllReviewsHandler,
  getPlatformStatsHandler,
  deleteReviewHandler,
} from "../controllers/reviewController.js";

import {
  protect,
  authorize,
} from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getPlatformStatsHandler);

router.get("/", getAllReviewsHandler);

router.delete("/:reviewId", deleteReviewHandler);

export default router;
