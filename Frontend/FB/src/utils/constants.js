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

  // Collector
  COLLECTOR_DASHBOARD: "/collector/dashboard",

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_RESIDENTS: "/admin/residents",
  ADMIN_APPROVED_COLLECTORS:
    "/admin/approved-collectors",
  ADMIN_PENDING_COLLECTORS:
    "/admin/pending-collectors",
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
};