import { ROLES, ROUTES } from "./constants";

// Get dashboard route based on user role
export const getDashboardRoute = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return ROUTES.ADMIN_DASHBOARD;

    case ROLES.COLLECTOR:
      return ROUTES.COLLECTOR_DASHBOARD;

    case ROLES.RESIDENT:
    default:
      return ROUTES.RESIDENT_DASHBOARD;
  }
};

// Capitalize first letter
export const capitalize = (text = "") => {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Format Date
export const formatDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format Date & Time
export const formatDateTime = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Get Axios Error Message
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong"
  );
};

// Check Roles
export const isAdmin = (user) =>
  user?.role === ROLES.ADMIN;

export const isCollector = (user) =>
  user?.role === ROLES.COLLECTOR;

export const isResident = (user) =>
  user?.role === ROLES.RESIDENT;

// Check Email Verification
export const isEmailVerified = (user) =>
  user?.emailVerified === true;

// Check Collector Approval
export const isCollectorApproved = (user) =>
  user?.isApproved === true;

// Get Display Name
export const getDisplayName = (user) =>
  user?.name || "User";

// Get User Initials
export const getInitials = (name = "") => {
  if (!name) return "";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

// Get Collector Status
export const getCollectorStatus = (collector) => {
  if (!collector) return "Unknown";

  if (!collector.emailVerified) {
    return "Email Not Verified";
  }

  if (!collector.isApproved) {
    return "Pending Approval";
  }

  if (collector.isAvailable) {
    return "Available";
  }

  return "Offline";
};

// Validate Email
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Validate Password
export const isValidPassword = (password) => {
  return password?.length >= 6;
};

// Format Coordinates
export const formatCoordinates = (location) => {
  if (!location?.coordinates) {
    return "Location not available";
  }

  const [lng, lat] = location.coordinates;

  return `${lat}, ${lng}`;
};