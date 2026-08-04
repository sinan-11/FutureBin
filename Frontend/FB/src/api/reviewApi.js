import axiosInstance from "./axiosInstance";

export const createReview = (data) =>
  axiosInstance.post("/reviews", data);

export const getPickupReviews = (pickupId) =>
  axiosInstance.get(`/reviews/pickups/${pickupId}`);

export const getUserReviews = (userId, page = 1, limit = 10) =>
  axiosInstance.get(`/reviews/users/${userId}?page=${page}&limit=${limit}`);

export const getUserReviewSummary = (userId) =>
  axiosInstance.get(`/reviews/users/${userId}/summary`);

export const getAllAdminReviews = (page = 1, limit = 20, filters = {}) => {
  const params = new URLSearchParams({ page, limit });

  if (filters.rating) params.append("rating", filters.rating);
  if (filters.role) params.append("role", filters.role);
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.pickupId) params.append("pickupId", filters.pickupId);

  return axiosInstance.get(`/admin/reviews?${params.toString()}`);
};

export const getAdminReviewStats = () =>
  axiosInstance.get("/admin/reviews/stats");

export const deleteAdminReview = (reviewId) =>
  axiosInstance.delete(`/admin/reviews/${reviewId}`);
