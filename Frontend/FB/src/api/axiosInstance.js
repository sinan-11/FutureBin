import axios from "axios";
import store from "../store/store";
import { API_BASE_URL, API_ENDPOINTS } from "../utils/constants";
import {
  setAccessToken,
  logout,
} from "../store/slices/authSlice";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach Access Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh Token Automatically
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
          {},
          {
            withCredentials: true,
          }
        );

        const newAccessToken =
          response.data.accessToken;

        store.dispatch(
          setAccessToken(newAccessToken)
        );

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (err) {
        store.dispatch(logout());

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;