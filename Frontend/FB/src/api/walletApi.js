import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const createWallet = () => axiosInstance.post(API_ENDPOINTS.WALLET_CREATE);
export const getMyWallet = () => axiosInstance.get(API_ENDPOINTS.WALLET_ME);
export const getTransactions = () => axiosInstance.get(API_ENDPOINTS.WALLET_TRANSACTIONS);
export const withdrawFunds = (amount, bankDetails) =>
  axiosInstance.post(API_ENDPOINTS.WALLET_WITHDRAW, { amount, bankDetails });
export const getWithdrawals = () => axiosInstance.get(API_ENDPOINTS.WALLET_WITHDRAWALS);
export const getWithdrawalById = (id) => axiosInstance.get(API_ENDPOINTS.WALLET_WITHDRAWAL_BY_ID(id));
