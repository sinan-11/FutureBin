import mongoose from "mongoose";
import Review from "../models/Review.js";
import PickupRequest from "../models/PickupRequest.js";
import User from "../models/User.js";

const REVIEW_POPULATE = [
  { path: "reviewer", select: "_id name role" },
  { path: "reviewee", select: "_id name role" },
  { path: "pickup", select: "_id pickupAddress wasteType completedAt" },
];

const VALID_REVIEWABLE_STATUSES = ["completed"];

export const createReview = async (pickupId, reviewerId, reviewerRole, rating, comment, tags) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const pickup = await PickupRequest.findById(pickupId).session(session);

    if (!pickup) {
      const err = new Error("Pickup request not found");
      err.status = 404;
      throw err;
    }

    if (!VALID_REVIEWABLE_STATUSES.includes(pickup.status)) {
      const err = new Error("Reviews can only be submitted for completed pickups");
      err.status = 400;
      throw err;
    }

    let revieweeId;

    if (reviewerRole === "resident") {
      if (String(pickup.resident) !== String(reviewerId)) {
        const err = new Error("You are not the resident for this pickup");
        err.status = 403;
        throw err;
      }
      if (!pickup.collector) {
        const err = new Error("No collector assigned to this pickup");
        err.status = 400;
        throw err;
      }
      revieweeId = pickup.collector;
    } else if (reviewerRole === "collector") {
      if (!pickup.collector || String(pickup.collector) !== String(reviewerId)) {
        const err = new Error("You are not the collector for this pickup");
        err.status = 403;
        throw err;
      }
      revieweeId = pickup.resident;
    } else {
      const err = new Error("Invalid reviewer role");
      err.status = 400;
      throw err;
    }

    const existingReview = await Review.findOne({
      pickup: pickupId,
      reviewer: reviewerId,
    }).session(session);

    if (existingReview) {
      const err = new Error("You have already reviewed this pickup");
      err.status = 409;
      throw err;
    }

    const [review] = await Review.create(
      [
        {
          pickup: pickupId,
          reviewer: reviewerId,
          reviewee: revieweeId,
          reviewerRole,
          rating,
          comment: comment || "",
          tags: tags || [],
        },
      ],
      { session }
    );

    await recalculateUserRating(revieweeId, session);

    await session.commitTransaction();
    session.endSession();

    return await Review.findById(review._id).populate(REVIEW_POPULATE);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getPickupReviews = async (pickupId) => {
  const reviews = await Review.find({ pickup: pickupId })
    .populate(REVIEW_POPULATE)
    .lean();

  const result = {
    residentReview: null,
    collectorReview: null,
  };

  for (const review of reviews) {
    if (review.reviewerRole === "resident") {
      result.residentReview = review;
    } else if (review.reviewerRole === "collector") {
      result.collectorReview = review;
    }
  }

  return result;
};

export const getUserReviews = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(REVIEW_POPULATE)
      .lean(),
    Review.countDocuments({ reviewee: userId }),
  ]);

  return {
    reviews,
    page,
    pages: Math.ceil(total / limit),
    total,
    limit,
  };
};

export const getUserReviewSummary = async (userId) => {
  const user = await User.findById(userId)
    .select("averageRating totalReviews ratingBreakdown")
    .lean();

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const recentReviews = await Review.find({ reviewee: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate(REVIEW_POPULATE)
    .lean();

  return {
    averageRating: user.averageRating,
    totalReviews: user.totalReviews,
    ratingBreakdown: user.ratingBreakdown,
    recentReviews,
  };
};

export const getAllReviews = async (page = 1, limit = 20, filters = {}) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.rating) {
    query.rating = Number(filters.rating);
  }

  if (filters.reviewerRole) {
    query.reviewerRole = filters.reviewerRole;
  }

  if (filters.userId) {
    query.$or = [{ reviewer: filters.userId }, { reviewee: filters.userId }];
  }

  if (filters.pickupId) {
    query.pickup = filters.pickupId;
  }

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: "reviewer", select: "_id name role" },
        { path: "reviewee", select: "_id name role" },
        { path: "pickup", select: "_id pickupAddress wasteType completedAt" },
      ])
      .lean(),
    Review.countDocuments(query),
  ]);

  return {
    reviews,
    page,
    pages: Math.ceil(total / limit),
    total,
    limit,
  };
};

export const deleteReviewAdmin = async (reviewId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const review = await Review.findById(reviewId).session(session);

    if (!review) {
      const err = new Error("Review not found");
      err.status = 404;
      throw err;
    }

    const revieweeId = review.reviewee;

    await Review.findByIdAndDelete(reviewId).session(session);

    await recalculateUserRating(revieweeId, session);

    await session.commitTransaction();
    session.endSession();

    return { message: "Review deleted successfully" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const recalculateUserRating = async (userId, session) => {
  const stats = await Review.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        breakdown: {
          $push: "$rating",
        },
      },
    },
  ]).session(session);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (stats.length > 0) {
    for (const r of stats[0].breakdown) {
      breakdown[r] = (breakdown[r] || 0) + 1;
    }
  }

  const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;
  const rawAverage = stats.length > 0 ? stats[0].averageRating : 0;
  const averageRating = Math.round(rawAverage * 10) / 10;

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        averageRating,
        totalReviews,
        ratingBreakdown: breakdown,
      },
    },
    { session }
  );
};

export const getPlatformReviewStats = async () => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  const lowestRated = await Review.aggregate([
    {
      $group: {
        _id: "$reviewee",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gte: 3 } } },
    { $sort: { avgRating: 1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 1,
        name: "$user.name",
        role: "$user.role",
        avgRating: { $round: ["$avgRating", 1] },
        count: 1,
      },
    },
  ]);

  const highestRatedCollectors = await Review.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "reviewee",
        foreignField: "_id",
        as: "userDoc",
      },
    },
    { $unwind: "$userDoc" },
    { $match: { "userDoc.role": "collector" } },
    {
      $group: {
        _id: "$reviewee",
        name: { $first: "$userDoc.name" },
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gte: 3 } } },
    { $sort: { avgRating: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 1,
        name: 1,
        avgRating: { $round: ["$avgRating", 1] },
        count: 1,
      },
    },
  ]);

  return {
    totalReviews: stats.length > 0 ? stats[0].totalReviews : 0,
    platformAverage: stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 0,
    lowestRated,
    highestRatedCollectors,
  };
};
