import { Navigate, Outlet } from "react-router-dom";

import Loader from "./Loader";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;