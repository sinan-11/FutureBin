import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import useAuth from "../hooks/useAuth";
import { logoutService } from "../services/authService";
import { ROUTES, ROLES } from "../utils/constants";

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutService();

    toast.success("Logged out successfully");

    navigate(ROUTES.HOME, { replace: true });
  };

  const getDashboardRoute = () => {
    if (!user) return ROUTES.HOME;

    switch (user.role) {
      case ROLES.ADMIN:
        return ROUTES.ADMIN_DASHBOARD;

      case ROLES.COLLECTOR:
        return ROUTES.COLLECTOR_DASHBOARD;

      default:
        return ROUTES.RESIDENT_DASHBOARD;
    }
  };

  return (
    <nav className="bg-green-600 shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        {/* Logo */}
        <Link
          to={ROUTES.HOME}
          className="text-2xl font-bold text-white"
        >
          Future Bin
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <Link
            to={ROUTES.HOME}
            className="text-white hover:text-green-200"
          >
            Home
          </Link>

          {!isAuthenticated ? (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="text-white hover:text-green-200"
              >
                Login
              </Link>

              <Link
                to={ROUTES.REGISTER}
                className="text-white hover:text-green-200"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to={getDashboardRoute()}
                className="text-white hover:text-green-200"
              >
                Dashboard
              </Link>

              <Link
                to="/profile"
                className="text-white hover:text-green-200"
              >
                Profile
              </Link>

              <span className="font-semibold text-white">
                {user?.name}
              </span>

              <button
                onClick={handleLogout}
                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;