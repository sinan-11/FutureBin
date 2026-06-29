import { Navigate, Outlet } from "react-router-dom";

import Loader from "./Loader";
import useAuth from "../hooks/useAuth";
import { ROLES, ROUTES } from "../utils/constants";

const CollectorRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user || user.role !== ROLES.COLLECTOR) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default CollectorRoute;