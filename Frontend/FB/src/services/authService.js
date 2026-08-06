import * as authApi from "../api/authApi";
import store from "../store/store";

import {
  setCredentials,
  setLoading,
  setError,
  clearError,
  logout as logoutAction,
} from "../store/slices/authSlice";

import { clearProfile } from "../store/slices/userSlice";
import { clearAdmin } from "../store/slices/adminSlice";

import { getErrorMessage } from "../utils/helpers";
import { REFRESH_TOKEN_STORAGE_KEY } from "../utils/constants";

// Register
export const registerService = async (data) => {
  store.dispatch(setLoading(true));
  store.dispatch(clearError());

  try {
    const response = await authApi.register(data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setError(message));
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Verify Email
export const verifyEmailService = async (data) => {
  store.dispatch(setLoading(true));
  store.dispatch(clearError());

  try {
    const response = await authApi.verifyEmail(data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setError(message));
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Resend OTP
export const resendOtpService = async (data) => {
  store.dispatch(setLoading(true));
  store.dispatch(clearError());

  try {
    const response = await authApi.resendOtp(data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setError(message));
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Login
export const loginService = async (data) => {
  store.dispatch(setLoading(true));
  store.dispatch(clearError());

  try {
    const response = await authApi.login(data);

    const { user, accessToken, refreshToken } = response.data;

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }

    store.dispatch(
      setCredentials({
        user,
        accessToken,
      })
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setError(message));
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Forgot Password
export const forgotPasswordService = async (data) => {
  store.dispatch(setLoading(true));
  store.dispatch(clearError());

  try {
    const response = await authApi.forgotPassword(data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setError(message));
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Reset Password
export const resetPasswordService = async (data) => {
  store.dispatch(setLoading(true));
  store.dispatch(clearError());

  try {
    const response = await authApi.resetPassword(data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setError(message));
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
};

// Logout
export const logoutService = async () => {
  try {
    await authApi.logout({
      refreshToken:
        localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || undefined,
    });
  } catch (error) {
    console.error(error);
  } finally {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    store.dispatch(logoutAction());
    store.dispatch(clearProfile());
    store.dispatch(clearAdmin());
  }
};