import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const createPickup = (data) =>
  axiosInstance.post(API_ENDPOINTS.CREATE_PICKUP, data);

export const getMyPickups = () =>
  axiosInstance.get(API_ENDPOINTS.GET_MY_PICKUPS);

export const getAssignedPickups = () =>
  axiosInstance.get(API_ENDPOINTS.GET_ASSIGNED_PICKUPS);

export const getAvailablePickups = () =>
  axiosInstance.get(API_ENDPOINTS.GET_AVAILABLE_PICKUPS);

export const acceptPickup = (id) =>
  axiosInstance.patch(API_ENDPOINTS.ACCEPT_PICKUP(id));

export const rejectPickup = (id) =>
  axiosInstance.patch(API_ENDPOINTS.REJECT_PICKUP(id));

export const updatePickupStatus = (id, status) =>
  axiosInstance.patch(API_ENDPOINTS.UPDATE_PICKUP_STATUS(id), { status });

export const cancelPickup = (id) =>
  axiosInstance.patch(API_ENDPOINTS.CANCEL_PICKUP(id));

export const arriveAtPickup = (id) =>
  axiosInstance.patch(API_ENDPOINTS.ARRIVE_PICKUP(id));

export const verifyWeight = (id, actualWeight) =>
  axiosInstance.patch(API_ENDPOINTS.VERIFY_WEIGHT(id), { actualWeight });

export const generateOtp = (id) =>
  axiosInstance.patch(API_ENDPOINTS.GENERATE_OTP(id));

export const getPickupOtp = (id) =>
  axiosInstance.get(API_ENDPOINTS.GET_PICKUP_OTP(id));

export const regenerateOtp = (id) =>
  axiosInstance.post(API_ENDPOINTS.REGENERATE_OTP(id));

export const verifyOtp = (id, otp) =>
  axiosInstance.patch(API_ENDPOINTS.VERIFY_OTP(id), { otp });
