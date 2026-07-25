import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const createSubscription = (data) =>
  axiosInstance.post(API_ENDPOINTS.CREATE_SUBSCRIPTION, data);

export const getMySubscriptions = () =>
  axiosInstance.get(API_ENDPOINTS.GET_MY_SUBSCRIPTIONS);

export const getSubscription = (id) =>
  axiosInstance.get(API_ENDPOINTS.GET_SUBSCRIPTION(id));

export const editSubscription = (id, data) =>
  axiosInstance.patch(API_ENDPOINTS.EDIT_SUBSCRIPTION(id), data);

export const pauseSubscription = (id) =>
  axiosInstance.patch(API_ENDPOINTS.PAUSE_SUBSCRIPTION(id));

export const resumeSubscription = (id) =>
  axiosInstance.patch(API_ENDPOINTS.RESUME_SUBSCRIPTION(id));

export const cancelSubscription = (id) =>
  axiosInstance.patch(API_ENDPOINTS.CANCEL_SUBSCRIPTION(id));

export const deleteSubscription = (id) =>
  axiosInstance.delete(API_ENDPOINTS.DELETE_SUBSCRIPTION(id));
