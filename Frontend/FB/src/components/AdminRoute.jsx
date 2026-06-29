import { Navigate, Outlet } from "react-router-dom";

import Loader from "./Loader";
import useAuth from "../hooks/useAuth";
import { ROLES, ROUTES } from "../utils/constants";

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!user || user.role !== ROLES.ADMIN) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};

export default AdminRoute;