import * as pickupApi from "../api/pickupApi";
import store from "../store/store";

import {
  setMyRequests,
  setAssignedRequests,
  setPickupLoading,
  setPickupError,
  clearPickupError,
} from "../store/slices/pickupSlice";

import { getErrorMessage } from "../utils/helpers";

export const createPickupService = async (data) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.createPickup(data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const getMyPickupsService = async () => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.getMyPickups();
    store.dispatch(setMyRequests(response.data.data));
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const getAvailablePickupsService = async () => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.getAvailablePickups();
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const getAssignedPickupsService = async () => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.getAssignedPickups();
    store.dispatch(setAssignedRequests(response.data.data));
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const rejectPickupService = async (id) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.rejectPickup(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const acceptPickupService = async (id) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.acceptPickup(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const updatePickupStatusService = async (id, status) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.updatePickupStatus(id, status);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const arriveAtPickupService = async (id) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.arriveAtPickup(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const verifyWeightService = async (id, actualWeight) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.verifyWeight(id, actualWeight);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const generateOtpService = async (id) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.generateOtp(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const regenerateOtpService = async (id) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.regenerateOtp(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const getPickupOtpService = async (id) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.getPickupOtp(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const verifyOtpService = async (id, otp) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.verifyOtp(id, otp);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};

export const cancelPickupService = async (id) => {
  store.dispatch(setPickupLoading(true));
  store.dispatch(clearPickupError());

  try {
    const response = await pickupApi.cancelPickup(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setPickupError(message));
    throw error;
  } finally {
    store.dispatch(setPickupLoading(false));
  }
};
