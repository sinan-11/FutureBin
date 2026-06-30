import axiosInstance from "./axiosInstance";

export const getDashboardStatsApi = () =>
  axiosInstance.get("/users/dashboard");

export const approveCollectorApi = (id) =>
  axiosInstance.patch(`/users/${id}/approve`);

export const rejectCollectorApi = (id, reason) =>
  axiosInstance.patch(`/users/${id}/reject`, { reason });