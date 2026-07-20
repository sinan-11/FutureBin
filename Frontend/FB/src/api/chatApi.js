import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const getChatMessages = (pickupId) =>
  axiosInstance.get(API_ENDPOINTS.CHAT_MESSAGES(pickupId));

export const sendChatMessage = (pickupId, message, receiverId) =>
  axiosInstance.post(API_ENDPOINTS.CHAT_MESSAGES(pickupId), {
    message,
    receiverId,
  });

export const markChatRead = (pickupId) =>
  axiosInstance.patch(API_ENDPOINTS.CHAT_READ(pickupId));
