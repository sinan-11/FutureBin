import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaMoon, FaSun, FaHome, FaLeaf, FaSignOutAlt, FaRobot } from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../hooks/useAuth";
import { logoutService } from "../services/authService";
import { ROUTES, ROLES } from "../utils/constants";
import Avatar from "./Avatar";

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
    ? "border-white/10 bg-surface-900/85 shadow-lg shadow-surface-900/20 backdrop-blur-xl"
    : "border-transparent bg-transparent";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${navClass}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition group-hover:scale-105">
            <FaLeaf className="h-4 w-4" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white md:text-2xl">
            Future<span className="text-emerald-400">Bin</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <FaHome className="h-3.5 w-3.5" />
            Home
          </Link>

          <Link
            to={ROUTES.AI_ASSISTANT}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <FaRobot className="h-3.5 w-3.5" />
            AI Assistant
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardRoute()}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Dashboard
              </Link>
              <div className="mx-1 h-4 w-px bg-white/20" />
              <div className="flex items-center gap-2 rounded-full bg-white/10 pl-1 pr-3 py-1">
                <Avatar name={user?.name} size="sm" />
                <span className="text-sm font-medium text-white/90">{user?.name?.split(" ")[0]}</span>
              </div>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Login
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-lg shadow-white/10 transition hover:bg-white/90 hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </>
          )}

          <button
            onClick={() => setDark(!dark)}
            className="ml-1 rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Toggle dark mode"
          >
            {dark ? <FaSun size={15} /> : <FaMoon size={15} />}
          </button>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="ml-1 flex items-center gap-1.5 rounded-full p-2 text-white/50 transition hover:bg-danger-50 dark:hover:bg-danger-500/100/20 hover:text-danger-300"
              title="Logout"
            >
              <FaSignOutAlt size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setDark(!dark)}
            className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Toggle dark mode"
          >
            {dark ? <FaSun size={16} /> : <FaMoon size={16} />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-surface-900/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-3">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <FaHome className="h-4 w-4" /> Home
            </Link>

            <Link
              to={ROUTES.AI_ASSISTANT}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <FaRobot className="h-4 w-4" /> AI Assistant
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardRoute()}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                  <Avatar name={user?.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-white/50 capitalize">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-danger-300 transition hover:bg-danger-50 dark:hover:bg-danger-500/100/20"
                >
                  <FaSignOutAlt className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
