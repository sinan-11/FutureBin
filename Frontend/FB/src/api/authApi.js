import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const register = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.REGISTER,
    data
  );

export const verifyEmail = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.VERIFY_EMAIL,
    data
  );

export const resendOtp = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.RESEND_OTP,
    data
  );

export const login = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.LOGIN,
    data
  );

export const forgotPassword = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.FORGOT_PASSWORD,
    data
  );

export const resetPassword = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.RESET_PASSWORD,
    data
  );

export const refreshToken = () =>
  axiosInstance.post(
    API_ENDPOINTS.REFRESH
  );

export const logout = () =>
  axiosInstance.post(
    API_ENDPOINTS.LOGOUT
  );