import * as subscriptionApi from "../api/subscriptionApi";
import store from "../store/store";
import {
  setSubscriptions,
  setSubscriptionLoading,
  setSubscriptionError,
  clearSubscriptionError,
} from "../store/slices/subscriptionSlice";
import { getErrorMessage } from "../utils/helpers";

export const createSubscriptionService = async (data) => {
  store.dispatch(setSubscriptionLoading(true));
  store.dispatch(clearSubscriptionError());
  try {
    const response = await subscriptionApi.createSubscription(data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setSubscriptionError(message));
    throw error;
  } finally {
    store.dispatch(setSubscriptionLoading(false));
  }
};

export const getMySubscriptionsService = async () => {
  store.dispatch(setSubscriptionLoading(true));
  store.dispatch(clearSubscriptionError());
  try {
    const response = await subscriptionApi.getMySubscriptions();
    store.dispatch(setSubscriptions(response.data.data));
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setSubscriptionError(message));
    throw error;
  } finally {
    store.dispatch(setSubscriptionLoading(false));
  }
};

export const getSubscriptionService = async (id) => {
  store.dispatch(setSubscriptionLoading(true));
  store.dispatch(clearSubscriptionError());
  try {
    const response = await subscriptionApi.getSubscription(id);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setSubscriptionError(message));
    throw error;
  } finally {
    store.dispatch(setSubscriptionLoading(false));
  }
};

export const editSubscriptionService = async (id, data) => {
  store.dispatch(setSubscriptionLoading(true));
  store.dispatch(clearSubscriptionError());
  try {
    const response = await subscriptionApi.editSubscription(id, data);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setSubscriptionError(message));
    throw error;
  } finally {
    store.dispatch(setSubscriptionLoading(false));
  }
};

export const pauseSubscriptionService = async (id) => {
  store.dispatch(setSubscriptionLoading(true));
  store.dispatch(clearSubscriptionError());
  try {
    const response = await subscriptionApi.pauseSubscription(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setSubscriptionError(message));
    throw error;
  } finally {
    store.dispatch(setSubscriptionLoading(false));
  }
};

export const resumeSubscriptionService = async (id) => {
  store.dispatch(setSubscriptionLoading(true));
  store.dispatch(clearSubscriptionError());
  try {
    const response = await subscriptionApi.resumeSubscription(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setSubscriptionError(message));
    throw error;
  } finally {
    store.dispatch(setSubscriptionLoading(false));
  }
};

export const cancelSubscriptionService = async (id) => {
  store.dispatch(setSubscriptionLoading(true));
  store.dispatch(clearSubscriptionError());
  try {
    const response = await subscriptionApi.cancelSubscription(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setSubscriptionError(message));
    throw error;
  } finally {
    store.dispatch(setSubscriptionLoading(false));
  }
};

export const deleteSubscriptionService = async (id) => {
  store.dispatch(setSubscriptionLoading(true));
  store.dispatch(clearSubscriptionError());
  try {
    const response = await subscriptionApi.deleteSubscription(id);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    store.dispatch(setSubscriptionError(message));
    throw error;
  } finally {
    store.dispatch(setSubscriptionLoading(false));
  }
};
