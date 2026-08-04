import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FaLeaf,
  FaBars,
  FaTimes,
  FaSun,
  FaMoon,
  FaSignOutAlt,
  FaBell,
  FaChevronLeft,
  FaRobot,
  FaBellSlash,
} from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../hooks/useAuth";
import { logoutService } from "../services/authService";
import { ROUTES } from "../utils/constants";
import Avatar from "./Avatar";

const AppShell = ({
  children,
  userName,
  title,
  subtitle,
  navItems = [],
  brandLink = ROUTES.HOME,
  backTo,
  maxWidth = "max-w-6xl",
  sidebarFooter,
  topbarActions,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains("dark")
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", prev ? "0" : "1");
      return !prev;
    });
  };

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out successfully");
    navigate(ROUTES.LOGIN);
  };

  const isActive = (item) => {
    const matches = item.match || [item.path];
    return matches.some((m) =>
      m === "/" ? location.pathname === "/" : location.pathname === m || location.pathname.startsWith(m)
    );
  };

  const displayName = userName || user?.name || "";
  const roleLabel =
    user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-3 px-5 ${collapsed ? "justify-center py-6" : "py-5"}`}>
        <Link
          to={brandLink}
          className="flex shrink-0 items-center gap-2"
          title="Future Bin"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <FaLeaf className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap text-lg font-extrabold tracking-tight text-surface-800 dark:text-surface-800">
              Future<span className="text-emerald-500">Bin</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`group relative flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
              } ${
                active
                  ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "text-surface-500 hover:bg-surface-100 hover:text-surface-800 dark:text-surface-400 dark:hover:bg-surface-200/60 dark:hover:text-surface-800"
              }`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 ${
                  active ? "text-emerald-600 dark:text-emerald-400" : ""
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}

        <div className="pt-2">
          <button
            onClick={() => navigate(ROUTES.AI_ASSISTANT)}
            title={collapsed ? "AI Assistant" : undefined}
            className={`group flex w-full items-center rounded-xl text-sm font-medium transition-all duration-200 ${
              collapsed ? "justify-center px-0 py-3" : "gap-3 px-3.5 py-2.5"
            } ${
              location.pathname === ROUTES.AI_ASSISTANT
                ? "bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                : "text-surface-500 hover:bg-surface-100 hover:text-surface-800 dark:text-surface-400 dark:hover:bg-surface-200/60 dark:hover:text-surface-800"
            }`}
          >
            <FaRobot
              className={`h-5 w-5 shrink-0 ${
                location.pathname === ROUTES.AI_ASSISTANT
                  ? "text-brand-600 dark:text-brand-400"
                  : ""
              }`}
            />
            {!collapsed && <span className="truncate">AI Assistant</span>}
          </button>
        </div>
      </nav>

      {sidebarFooter && !collapsed && (
        <div className="px-4 pb-3">{sidebarFooter}</div>
      )}

      <div className={`border-t border-surface-200/70 p-3 dark:border-surface-200/60 ${collapsed ? "" : ""}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar name={displayName} size="sm" />
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-surface-500 transition hover:bg-danger-50 hover:text-danger-600 dark:text-surface-400 dark:hover:bg-danger-500/10"
            >
              <FaSignOutAlt className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name={displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-surface-800 dark:text-surface-800">
                {displayName || "User"}
              </p>
              <p className="truncate text-xs capitalize text-surface-500 dark:text-surface-400">
                {roleLabel}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-surface-400 transition hover:bg-danger-50 hover:text-danger-600 dark:text-surface-500 dark:hover:bg-danger-500/10"
            >
              <FaSignOutAlt className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-50">
      {/* ─── Desktop sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-surface-200/70 bg-surface transition-all duration-300 dark:border-surface-200/60 dark:bg-surface-100 md:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {sidebar}
      </aside>

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="animate-slide-in-left relative flex h-full w-72 flex-col bg-surface shadow-popover dark:bg-surface-100">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition hover:bg-surface-100 dark:hover:bg-surface-200"
              aria-label="Close sidebar"
            >
              <FaTimes className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* ─── Main column ─── */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${
          collapsed ? "md:pl-[76px]" : "md:pl-64"
        }`}
      >
        {/* ─── Topbar ─── */}
        <header className="sticky top-0 z-30 border-b border-surface-200/70 bg-surface/80 backdrop-blur-xl dark:border-surface-200/60 dark:bg-surface-100/80">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-600 transition hover:bg-surface-100 md:hidden dark:border-surface-200 dark:text-surface-500"
              aria-label="Open sidebar"
            >
              <FaBars className="h-4 w-4" />
            </button>

            <button
              onClick={handleToggleCollapse}
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-500 transition hover:bg-surface-100 md:flex dark:border-surface-200 dark:hover:bg-surface-200"
              aria-label="Toggle sidebar"
            >
              <FaBars className="h-4 w-4" />
            </button>

            {backTo && (
              <button
                onClick={() => navigate(backTo)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-500 transition hover:bg-surface-100 dark:border-surface-200 dark:hover:bg-surface-200"
                aria-label="Go back"
              >
                <FaChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold tracking-tight text-surface-800 sm:text-lg dark:text-surface-800">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden truncate text-xs text-surface-500 sm:block dark:text-surface-400">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {topbarActions}

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-500 transition hover:bg-surface-100 dark:border-surface-200 dark:text-surface-400 dark:hover:bg-surface-200"
                  aria-label="Notifications"
                >
                  <FaBell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </button>

                {notifOpen && (
                  <div className="animate-pop absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-surface-200 bg-surface shadow-popover dark:border-surface-200 dark:bg-surface-100">
                    <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-200/60">
                      <p className="text-sm font-semibold text-surface-800 dark:text-surface-800">
                        Notifications
                      </p>
                      <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-semibold text-surface-500 dark:bg-surface-200 dark:text-surface-500">
                        0 new
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-100 text-surface-400 dark:bg-surface-200 dark:text-surface-500">
                        <FaBellSlash className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                        You're all caught up
                      </p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">
                        Pickup updates will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => setDark((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-500 transition hover:bg-surface-100 dark:border-surface-200 dark:text-surface-400 dark:hover:bg-surface-200"
                aria-label="Toggle dark mode"
              >
                {dark ? <FaSun className="h-4 w-4" /> : <FaMoon className="h-4 w-4" />}
              </button>

              {/* AI assistant shortcut */}
              <button
                onClick={() => navigate(ROUTES.AI_ASSISTANT)}
                className="hidden h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-500 transition hover:bg-surface-100 sm:flex dark:border-surface-200 dark:text-surface-400 dark:hover:bg-surface-200"
                aria-label="AI Assistant"
              >
                <FaRobot className="h-4 w-4" />
              </button>

              {/* User */}
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar name={displayName} size="sm" />
              </div>
            </div>
          </div>
        </header>

        {/* ─── Content ─── */}
        <main className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 ${maxWidth}`}>
          {children}
        </main>
      </div>

      {/* ─── Mobile bottom nav ─── */}
      {navItems.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200/70 bg-surface/95 backdrop-blur-xl md:hidden dark:border-surface-200/60 dark:bg-surface-100/95">
          <div className="flex items-stretch justify-around px-1 py-1.5">
            {navItems.slice(0, 4).map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ${
                    active
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-surface-400 hover:text-surface-600 dark:text-surface-500"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default AppShell;
