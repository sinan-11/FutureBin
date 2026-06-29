import * as userApi from "../api/userApi";
import store from "../store/store";

import {
  setProfile,
  setUserLoading,
  setUserError,
} from "../store/slices/userSlice";

import {
  setUsers,
  setAdminLoading,
  setAdminError,
  updateUser,
  removeUser,
} from "../store/slices/adminSlice";

import { getErrorMessage } from "../utils/helpers";

// Get Current User
export const getMeService = async () => {
  store.dispatch(setUserLoading(true));

  try {
    const response = await userApi.getMe();

    store.dispatch(setProfile(response.data.data));

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    store.dispatch(setUserError(message));

    throw error;
  } finally {
    store.dispatch(setUserLoading(false));
  }
};

// Update Collector Availability
export const updateAvailabilityService = async (status) => {
  store.dispatch(setUserLoading(true));

  try {
    const response = await userApi.updateAvailability(status);

    store.dispatch(setProfile(response.data.data));

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    store.dispatch(setUserError(message));

    throw error;
  } finally {
    store.dispatch(setUserLoading(false));
  }
};

// Update User Location
export const updateLocationService = async (
  longitude,
  latitude
) => {
  store.dispatch(setUserLoading(true));

  try {
    const response =
      await userApi.updateLocation(
        longitude,
        latitude
      );

    store.dispatch(setProfile(response.data.data));

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    store.dispatch(setUserError(message));

    throw error;
  } finally {
    store.dispatch(setUserLoading(false));
  }
};

// Admin - Get All Users
export const getUsersService = async () => {
  store.dispatch(setAdminLoading(true));

  try {
    const response = await userApi.getUsers();

    store.dispatch(setUsers(response.data.data));

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    store.dispatch(setAdminError(message));

    throw error;
  } finally {
    store.dispatch(setAdminLoading(false));
  }
};

// Admin - Approve Collector
export const approveCollectorService = async (
  id
) => {
  store.dispatch(setAdminLoading(true));

  try {
    const response =
      await userApi.approveCollector(id);

    store.dispatch(
      updateUser(response.data.data)
    );

    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);

    store.dispatch(setAdminError(message));

    throw error;
  } finally {
    store.dispatch(setAdminLoading(false));
  }
};

// Admin - Reject Collector
export const rejectCollectorService = async (
  id
) => {
  store.dispatch(setAdminLoading(true));

  try {
    await userApi.rejectCollector(id);

    store.dispatch(removeUser(id));

    return {
      success: true,
    };
  } catch (error) {
    const message = getErrorMessage(error);

    store.dispatch(setAdminError(message));

    throw error;
  } finally {
    store.dispatch(setAdminLoading(false));
  }
};