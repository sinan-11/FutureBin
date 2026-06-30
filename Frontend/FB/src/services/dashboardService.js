import {
  getDashboardStatsApi,
  approveCollectorApi,
  rejectCollectorApi,
} from "../api/dashboardApi";

export const getDashboardStats = async () => {
  const res = await getDashboardStatsApi();
  return res.data.data;
};

export const approveCollector = async (id) => {
  const res = await approveCollectorApi(id);
  return res.data;
};

export const rejectCollector = async (id, reason) => {
  const res = await rejectCollectorApi(id, reason);
  return res.data;
};