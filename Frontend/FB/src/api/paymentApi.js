import axiosInstance from "./axiosInstance";

export const createOrder = (amount) =>
  axiosInstance.post("/payments/order", { amount });

export const verifyPayment = (data) =>
  axiosInstance.post("/payments/verify", data);
