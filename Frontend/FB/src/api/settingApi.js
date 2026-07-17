import axiosInstance from "./axiosInstance";

export const getSettings = () =>
  axiosInstance.get("/settings");

export const updateSetting = (key, value) =>
  axiosInstance.put(`/settings/${key}`, { value });

export const bulkUpdateSettings = (settings) =>
  axiosInstance.put("/settings/bulk", { settings });
