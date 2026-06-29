import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "./utils/constants";

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
import PendingCollectors from "./pages/admin/PendingCollectors";

// Route Guards
import ProtectedRoute from "./components/ProtectedRoute";
import ResidentRoute from "./components/ResidentRoute";
import CollectorRoute from "./components/CollectorRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>

        {/* Resident */}
        <Route element={<ResidentRoute />}>
          <Route
            path={ROUTES.RESIDENT_DASHBOARD}
            element={<ResidentDashboard />}
          />
        </Route>

        {/* Collector */}
        <Route element={<CollectorRoute />}>
          <Route
            path={ROUTES.COLLECTOR_DASHBOARD}
            element={<CollectorDashboard />}
          />
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route
            path={ROUTES.ADMIN_DASHBOARD}
            element={<AdminDashboard />}
          />
          <Route
            path={ROUTES.ADMIN_PENDING_COLLECTORS}
            element={<PendingCollectors />}
          />
        </Route>

      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default App;