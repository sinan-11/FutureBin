import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaMoon, FaSun } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "./Button";
import useAuth from "../hooks/useAuth";
import { logoutService } from "../services/authService";
import { ROUTES, ROLES } from "../utils/constants";

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out successfully");
    navigate(ROUTES.HOME, { replace: true });
  };

  const getDashboardRoute = () => {
    if (!user) return ROUTES.HOME;
    switch (user.role) {
      case ROLES.ADMIN: return ROUTES.ADMIN_DASHBOARD;
      case ROLES.COLLECTOR: return ROUTES.COLLECTOR_DASHBOARD;
      default: return ROUTES.RESIDENT_DASHBOARD;
    }
  };

  const navClass = scrolled
    ? "bg-brand-700/95 shadow-sm backdrop-blur-lg"
    : "bg-transparent";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b border-white/10 transition-all duration-300 ${navClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
        <Link to={ROUTES.HOME} className="text-xl font-bold tracking-tight text-white md:text-2xl">
          Future Bin
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to={ROUTES.HOME} className="text-sm font-medium text-white/80 transition hover:text-white">
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link to={getDashboardRoute()} className="text-sm font-medium text-white/80 transition hover:text-white">
                Dashboard
              </Link>
              <span className="text-sm text-white/60">{user?.name}</span>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="text-sm font-medium text-white/80 transition hover:text-white">
                Login
              </Link>
              <Link to={ROUTES.REGISTER} className="text-sm font-medium text-white/80 transition hover:text-white">
                Register
              </Link>
            </>
          )}

          <button
            onClick={() => setDark(!dark)}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Toggle dark mode"
          >
            {dark ? <FaSun size={16} /> : <FaMoon size={16} />}
          </button>

          {isAuthenticated && (
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setDark(!dark)}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Toggle dark mode"
          >
            {dark ? <FaSun size={16} /> : <FaMoon size={16} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white" aria-label="Toggle navigation menu">
            {mobileOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="space-y-3 border-t border-white/10 bg-brand-700/95 px-4 pb-5 pt-3 backdrop-blur-lg md:hidden">
          <Link to={ROUTES.HOME} className="block text-sm font-medium text-white/80 hover:text-white" onClick={() => setMobileOpen(false)}>
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link to={getDashboardRoute()} className="block text-sm font-medium text-white/80 hover:text-white" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
              <span className="block text-sm text-white/60">{user?.name}</span>
              <Button variant="danger" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className="block text-sm font-medium text-white/80 hover:text-white" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link to={ROUTES.REGISTER} className="block text-sm font-medium text-white/80 hover:text-white" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
