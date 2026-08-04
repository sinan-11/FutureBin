import {
  createReview,
  getPickupReviews,
  getUserReviews,
  getUserReviewSummary,
  deleteReviewAdmin,
  getAllReviews,
  getPlatformReviewStats,
} from "../services/reviewService.js";

export const createReviewHandler = async (req, res) => {
  try {
    const { rating, comment, tags, pickup } = req.body;

    const review = await createReview(
      pickup,
      req.user.id,
      req.user.role,
      Number(rating),
      comment || "",
      tags || []
    );

    const summary = await getUserReviewSummary(review.reviewee._id);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: { review, summary },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getPickupReviewsHandler = async (req, res) => {
  try {
    const { pickupId } = req.params;

    if (!pickupId) {
      return res.status(400).json({
        success: false,
        message: "Pickup ID is required",
      });
    }

    const reviews = await getPickupReviews(pickupId);

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getUserReviewsHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const reviews = await getUserReviews(userId, page, limit);

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getUserReviewSummaryHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const summary = await getUserReviewSummary(userId);

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getAllReviewsHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const filters = {};
    if (req.query.rating) filters.rating = req.query.rating;
    if (req.query.role) filters.reviewerRole = req.query.role;
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.pickupId) filters.pickupId = req.query.pickupId;

    const reviews = await getAllReviews(page, limit, filters);

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getPlatformStatsHandler = async (req, res) => {
  try {
    const stats = await getPlatformReviewStats();

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReviewHandler = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const result = await deleteReviewAdmin(reviewId);

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
