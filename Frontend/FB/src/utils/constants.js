// Backend URL
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// User Roles
export const ROLES = {
  RESIDENT: "resident",
  COLLECTOR: "collector",
  ADMIN: "admin",
};

// App Routes
// App Routes
export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Resident
  RESIDENT_DASHBOARD: "/resident/dashboard",
  RESIDENT_CREATE_REQUEST: "/resident/create-request",
  RESIDENT_MY_REQUESTS: "/resident/my-requests",
  RESIDENT_WALLET: "/resident/wallet",

  // Collector
  COLLECTOR_DASHBOARD: "/collector/dashboard",
  COLLECTOR_AVAILABLE: "/collector/available",
  COLLECTOR_MY_PICKUPS: "/collector/my-pickups",
  COLLECTOR_WALLET: "/collector/wallet",

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_RESIDENTS: "/admin/residents",
  ADMIN_APPROVED_COLLECTORS:
    "/admin/approved-collectors",
  ADMIN_PENDING_COLLECTORS:
    "/admin/pending-collectors",
  ADMIN_SETTINGS: "/admin/settings",
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  REGISTER: "/auth/register",
  VERIFY_EMAIL: "/auth/verify-email",
  RESEND_OTP: "/auth/resend-otp",
  LOGIN: "/auth/login",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",

  // User
  GET_ME: "/users/me",
  UPDATE_LOCATION: "/users/location",
  UPDATE_AVAILABILITY:
    "/users/availability",

  // Admin
  GET_USERS: "/users",

  // Pickup Requests
  CREATE_PICKUP: "/pickup-requests",
  GET_MY_PICKUPS: "/pickup-requests/my",
  GET_ASSIGNED_PICKUPS: "/pickup-requests/assigned",
  GET_AVAILABLE_PICKUPS: "/pickup-requests/available",
  ACCEPT_PICKUP: (id) => `/pickup-requests/${id}/accept`,
  REJECT_PICKUP: (id) => `/pickup-requests/${id}/reject`,
  UPDATE_PICKUP_STATUS: (id) => `/pickup-requests/${id}/status`,
  CANCEL_PICKUP: (id) => `/pickup-requests/${id}/cancel`,
  ARRIVE_PICKUP: (id) => `/pickup-requests/${id}/arrive`,
  VERIFY_WEIGHT: (id) => `/pickup-requests/${id}/verify-weight`,
  GENERATE_OTP: (id) => `/pickup-requests/${id}/generate-otp`,
  GET_PICKUP_OTP: (id) => `/pickup-requests/${id}/otp`,
  REGENERATE_OTP: (id) => `/pickup-requests/${id}/regenerate-otp`,
  VERIFY_OTP: (id) => `/pickup-requests/${id}/verify-otp`,

  // Wallet
  WALLET_CREATE: "/wallet/create",
  WALLET_ME: "/wallet/me",
  WALLET_TRANSACTIONS: "/wallet/transactions",

  // Chat
  CHAT_MESSAGES: (pickupId) => `/chat/${pickupId}/messages`,
  CHAT_READ: (pickupId) => `/chat/${pickupId}/read`,

  // Settings
  GET_SETTINGS: "/settings",
  UPDATE_SETTINGS: "/settings/bulk",
};

// Toast Messages
export const MESSAGES = {
  LOGIN_SUCCESS:
    "Login successful",

  LOGOUT_SUCCESS:
    "Logged out successfully",

  REGISTER_SUCCESS:
    "Registration successful. Please verify your email.",

  EMAIL_VERIFIED:
    "Email verified successfully.",

  PASSWORD_RESET:
    "Password reset successful.",

  PROFILE_UPDATED:
    "Profile updated successfully.",

  LOCATION_UPDATED:
    "Location updated successfully.",

  APPROVED:
    "Collector approved successfully.",

  REJECTED:
    "Collector rejected successfully.",

  SOMETHING_WENT_WRONG:
    "Something went wrong.",

  PICKUP_CREATED:
    "Pickup request created successfully!",
  PICKUP_ACCEPTED:
    "Pickup request accepted!",
  PICKUP_CANCELLED:
    "Pickup request cancelled.",
  PICKUP_STATUS_UPDATED:
    "Pickup status updated.",

  WALLET_CREATED:
    "Wallet created successfully",
  WALLET_FETCH_ERROR:
    "Failed to load wallet",
};