import * as reviewApi from "../api/reviewApi";
import store from "../store/store";

import {
  setPickupReviews,
  setUserReviews,
  setReviewSummary,
  setAdminReviews,
  setAdminStats,
  setReviewLoading,
  setReviewCreating,
  setReviewError,
  clearReviewError,
} from "../store/slices/reviewSlice";

import { getErrorMessage } from "../utils/helpers";

export const createReviewService = async (data) => {
  store.dispatch(setReviewCreating(true));
  store.dispatch(clearReviewError());

  try {
    const response = await reviewApi.createReview(data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setReviewError(message));
    throw error;
  } finally {
    store.dispatch(setReviewCreating(false));
  }
};

export const getPickupReviewsService = async (pickupId) => {
  store.dispatch(setReviewLoading(true));
  store.dispatch(clearReviewError());

  try {
    const response = await reviewApi.getPickupReviews(pickupId);
    store.dispatch(setPickupReviews(response.data.data));
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setReviewError(message));
    throw error;
  } finally {
    store.dispatch(setReviewLoading(false));
  }
};

export const getUserReviewsService = async (userId, page = 1, limit = 10) => {
  store.dispatch(setReviewLoading(true));
  store.dispatch(clearReviewError());

  try {
    const response = await reviewApi.getUserReviews(userId, page, limit);
    store.dispatch(setUserReviews(response.data.data));
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setReviewError(message));
    throw error;
  } finally {
    store.dispatch(setReviewLoading(false));
  }
};

export const getUserReviewSummaryService = async (userId) => {
  const response = await reviewApi.getUserReviewSummary(userId);
  store.dispatch(setReviewSummary(response.data.data));
  return response.data.data;
};

export const getAllAdminReviewsService = async (page = 1, limit = 20, filters = {}) => {
  store.dispatch(setReviewLoading(true));
  store.dispatch(clearReviewError());

  try {
    const response = await reviewApi.getAllAdminReviews(page, limit, filters);
    store.dispatch(setAdminReviews(response.data.data));
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setReviewError(message));
    throw error;
  } finally {
    store.dispatch(setReviewLoading(false));
  }
};

export const getAdminReviewStatsService = async () => {
  const response = await reviewApi.getAdminReviewStats();
  store.dispatch(setAdminStats(response.data.data));
  return response.data.data;
};

export const deleteAdminReviewService = async (reviewId) => {
  try {
    await reviewApi.deleteAdminReview(reviewId);
    return true;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setReviewError(message));
    throw error;
  }
};
