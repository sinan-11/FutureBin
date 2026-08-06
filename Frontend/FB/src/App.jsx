import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";

import { API_BASE_URL, API_ENDPOINTS, ROUTES, REFRESH_TOKEN_STORAGE_KEY } from "./utils/constants";
import axiosInstance from "./api/axiosInstance";
import store from "./store/store";
import { setCredentials, setAccessToken, logout } from "./store/slices/authSlice";
import { clearProfile } from "./store/slices/userSlice";
import { clearAdmin } from "./store/slices/adminSlice";

// AI Assistant
import AiAssistant from "./pages/AiAssistant";
import AiAssistantFab from "./components/AiAssistantFab";

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
import AdminReviews from "./pages/admin/Reviews";

// Route Guards
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import ResidentRoute from "./components/ResidentRoute";
import CollectorRoute from "./components/CollectorRoute";
import AdminRoute from "./components/AdminRoute";

import { selectIsAuthenticated } from "./store/slices/authSlice";

let authInitStarted = false;

function App() {
  const [initializing, setInitializing] = useState(true);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    // StrictMode double-invokes effects in dev. The refresh token is single-use
    // and rotated on every call, so firing it twice concurrently makes the
    // second call fail and logs the user out. Guard it to run once per load.
    if (authInitStarted) return;
    authInitStarted = true;

    const initAuth = async () => {
      try {
        const storedRefreshToken =
          localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

        const refreshRes = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          { withCredentials: true }
        );

        const newAccessToken = refreshRes.data.accessToken;
        if (!newAccessToken) throw new Error("No token");

        if (refreshRes.data.refreshToken) {
          localStorage.setItem(
            REFRESH_TOKEN_STORAGE_KEY,
            refreshRes.data.refreshToken
          );
        }

        store.dispatch(setAccessToken(newAccessToken));

        const meRes = await axiosInstance.get(API_ENDPOINTS.GET_ME);
        store.dispatch(setCredentials({ user: meRes.data.data, accessToken: newAccessToken }));
      } catch {
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
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
    <>
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
        <Route path={ROUTES.AI_ASSISTANT} element={<AiAssistant />} />

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
          <Route path={ROUTES.ADMIN_REVIEWS} element={<AdminReviews />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>

      {isAuthenticated && <AiAssistantFab />}
    </>
  );
}

export default App;
