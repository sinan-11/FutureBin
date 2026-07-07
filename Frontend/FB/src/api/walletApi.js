import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const createWallet = () => axiosInstance.post(API_ENDPOINTS.WALLET_CREATE);
export const getMyWallet = () => axiosInstance.get(API_ENDPOINTS.WALLET_ME);
export const getTransactions = () => axiosInstance.get(API_ENDPOINTS.WALLET_TRANSACTIONS);
