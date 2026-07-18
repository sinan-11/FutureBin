import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaSignOutAlt, FaPlus, FaList, FaTachometerAlt, FaArrowLeft, FaWallet } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../components/Button";
import { logoutService } from "../services/authService";
import { ROUTES } from "../utils/constants";

const navItems = [
  { label: "Dashboard", path: ROUTES.RESIDENT_DASHBOARD, icon: FaTachometerAlt },
  { label: "New Request", path: ROUTES.RESIDENT_CREATE_REQUEST, icon: FaPlus },
  { label: "My Requests", path: ROUTES.RESIDENT_MY_REQUESTS, icon: FaList },
  { label: "Wallet", path: ROUTES.RESIDENT_WALLET, icon: FaWallet },
];

const PAGE_TITLES = {
  [ROUTES.RESIDENT_DASHBOARD]: "Dashboard",
  [ROUTES.RESIDENT_CREATE_REQUEST]: "New Request",
  [ROUTES.RESIDENT_MY_REQUESTS]: "My Requests",
  [ROUTES.RESIDENT_WALLET]: "Wallet",
};

const ResidentLayout = ({ children, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === ROUTES.RESIDENT_DASHBOARD;

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out successfully");
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-brand-700/95 backdrop-blur-lg border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <div className="flex items-center gap-3">
            {!isDashboard && (
              <button
                onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-90"
              >
                <FaArrowLeft className="h-4 w-4 text-white" />
              </button>
            )}
            <Link to={ROUTES.HOME} className="text-xl font-bold tracking-tight text-white">
              Future Bin
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {userName && (
              <span className="hidden text-sm font-medium text-white/80 sm:block">{userName}</span>
            )}
            <Button variant="ghost" size="sm" icon={FaSignOutAlt} onClick={handleLogout} className="!text-white/80 hover:!bg-white/10 hover:!text-white">Logout</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl gap-6 px-4 py-6">
        <nav className="hidden w-48 flex-shrink-0 space-y-1 md:block">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? "bg-brand-50 text-brand-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <item.icon className={`h-4 w-4 ${location.pathname === item.path ? "text-brand-600" : ""}`} />
              {item.label}
            </button>
          ))}
        </nav>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-all ${
                location.pathname === item.path
                  ? "text-brand-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ResidentLayout;
