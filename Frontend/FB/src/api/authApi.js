import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

// Register
export const register = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.REGISTER,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

// Verify Email
export const verifyEmail = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.VERIFY_EMAIL,
    data
  );

// Resend OTP
export const resendOtp = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.RESEND_OTP,
    data
  );

// Login
export const login = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.LOGIN,
    data
  );

// Forgot Password
export const forgotPassword = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.FORGOT_PASSWORD,
    data
  );

// Reset Password
export const resetPassword = (data) =>
  axiosInstance.post(
    API_ENDPOINTS.RESET_PASSWORD,
    data
  );

// Refresh Access Token
export const refreshToken = () =>
  axiosInstance.post(
    API_ENDPOINTS.REFRESH
  );

// Logout
export const logout = () =>
  axiosInstance.post(
    API_ENDPOINTS.LOGOUT
  );