import axiosInstance from "./axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

// Current User
export const getMe = () =>
  axiosInstance.get(
    API_ENDPOINTS.GET_ME
  );

// Collector
export const updateAvailability = (
  status
) =>
  axiosInstance.patch(
    API_ENDPOINTS.UPDATE_AVAILABILITY,
    {
      status,
    }
  );

export const updateLocation = (
  longitude,
  latitude
) =>
  axiosInstance.patch(
    API_ENDPOINTS.UPDATE_LOCATION,
    {
      longitude,
      latitude,
    }
  );

// Admin
export const getUsers = () =>
  axiosInstance.get(
    API_ENDPOINTS.GET_USERS
  );

export const getUser = (id) =>
  axiosInstance.get(
    `${API_ENDPOINTS.GET_USERS}/${id}`
  );

export const approveCollector = (id) =>
  axiosInstance.patch(
    `${API_ENDPOINTS.GET_USERS}/${id}/approve`
  );

export const rejectCollector = (id) =>
  axiosInstance.patch(
    `${API_ENDPOINTS.GET_USERS}/${id}/reject`
  );