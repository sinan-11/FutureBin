import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  pickupReviews: { residentReview: null, collectorReview: null },
  userReviews: { reviews: [], page: 1, pages: 1, total: 0 },
  summary: { averageRating: 0, totalReviews: 0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, recentReviews: [] },
  adminReviews: { reviews: [], page: 1, pages: 1, total: 0 },
  adminStats: { totalReviews: 0, platformAverage: 0, lowestRated: [], highestRatedCollectors: [] },
  loading: false,
  creating: false,
  error: null,
};

const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    setPickupReviews: (state, action) => {
      state.pickupReviews = action.payload;
    },

    setUserReviews: (state, action) => {
      state.userReviews = action.payload;
    },

    setReviewSummary: (state, action) => {
      state.summary = action.payload;
    },

    setAdminReviews: (state, action) => {
      state.adminReviews = action.payload;
    },

    setAdminStats: (state, action) => {
      state.adminStats = action.payload;
    },

    setReviewLoading: (state, action) => {
      state.loading = action.payload;
    },

    setReviewCreating: (state, action) => {
      state.creating = action.payload;
    },

    setReviewError: (state, action) => {
      state.error = action.payload;
      state.creating = false;
      state.loading = false;
    },

    clearReviewError: (state) => {
      state.error = null;
    },

    clearReviews: (state) => {
      state.pickupReviews = { residentReview: null, collectorReview: null };
      state.userReviews = { reviews: [], page: 1, pages: 1, total: 0 };
      state.summary = { averageRating: 0, totalReviews: 0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, recentReviews: [] };
      state.loading = false;
      state.creating = false;
      state.error = null;
    },
  },
});

export const {
  setPickupReviews,
  setUserReviews,
  setReviewSummary,
  setAdminReviews,
  setAdminStats,
  setReviewLoading,
  setReviewCreating,
  setReviewError,
  clearReviewError,
  clearReviews,
} = reviewSlice.actions;

export default reviewSlice.reducer;

export const selectPickupReviews = (state) => state.review.pickupReviews;
export const selectUserReviews = (state) => state.review.userReviews;
export const selectReviewSummary = (state) => state.review.summary;
export const selectAdminReviews = (state) => state.review.adminReviews;
export const selectAdminStats = (state) => state.review.adminStats;
export const selectReviewLoading = (state) => state.review.loading;
export const selectReviewCreating = (state) => state.review.creating;
export const selectReviewError = (state) => state.review.error;
