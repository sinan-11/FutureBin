import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import { API_BASE_URL, API_ENDPOINTS, ROUTES } from "./utils/constants";
import axiosInstance from "./api/axiosInstance";
import store from "./store/store";
import { setCredentials, setAccessToken, logout } from "./store/slices/authSlice";
import { clearProfile } from "./store/slices/userSlice";
import { clearAdmin } from "./store/slices/adminSlice";

// Public Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Dashboards
import ResidentDashboard from "./pages/resident/Dashboard";
import CollectorDashboard from "./pages/collector/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";

// Pickup Pages
import CreateRequest from "./pages/resident/CreateRequest";
import MyRequests from "./pages/resident/MyRequests";
import CollectorMyPickups from "./pages/collector/MyPickups";
import CollectorAvailable from "./pages/collector/AvailableRequests";

// Subscription Pages
import CreateSubscription from "./pages/resident/CreateSubscription";
import MySubscriptions from "./pages/resident/MySubscriptions";
import EditSubscription from "./pages/resident/EditSubscription";

// Admin Pages
import Residents from "./pages/admin/Residents";
import ApprovedCollectors from "./pages/admin/ApprovedCollectors";
import PendingCollectors from "./pages/admin/PendingCollectors";
import AdminSettings from "./pages/admin/Settings";

// Route Guards
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import ResidentRoute from "./components/ResidentRoute";
import CollectorRoute from "./components/CollectorRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const refreshRes = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshRes.data.accessToken;
        if (!newAccessToken) throw new Error("No token");

        store.dispatch(setAccessToken(newAccessToken));

        const meRes = await axiosInstance.get(API_ENDPOINTS.GET_ME);
        store.dispatch(setCredentials({ user: meRes.data.data, accessToken: newAccessToken }));
      } catch {
        store.dispatch(logout());
        store.dispatch(clearProfile());
        store.dispatch(clearAdmin());
      } finally {
        setInitializing(false);
      }
    };
    initAuth();
  }, []);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />

      <Route element={<PublicRoute />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<ResidentRoute />}>
          <Route path={ROUTES.RESIDENT_DASHBOARD} element={<ResidentDashboard />} />
          <Route path={ROUTES.RESIDENT_CREATE_REQUEST} element={<CreateRequest />} />
          <Route path={ROUTES.RESIDENT_MY_REQUESTS} element={<MyRequests />} />
          <Route path={ROUTES.RESIDENT_CREATE_SUBSCRIPTION} element={<CreateSubscription />} />
          <Route path={ROUTES.RESIDENT_MY_SUBSCRIPTIONS} element={<MySubscriptions />} />
          <Route path={ROUTES.RESIDENT_EDIT_SUBSCRIPTION} element={<EditSubscription />} />
        </Route>

        <Route element={<CollectorRoute />}>
          <Route path={ROUTES.COLLECTOR_DASHBOARD} element={<CollectorDashboard />} />
          <Route path={ROUTES.COLLECTOR_AVAILABLE} element={<CollectorAvailable />} />
          <Route path={ROUTES.COLLECTOR_MY_PICKUPS} element={<CollectorMyPickups />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
          <Route path={ROUTES.ADMIN_RESIDENTS} element={<Residents />} />
          <Route path={ROUTES.ADMIN_APPROVED_COLLECTORS} element={<ApprovedCollectors />} />
          <Route path={ROUTES.ADMIN_PENDING_COLLECTORS} element={<PendingCollectors />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;
