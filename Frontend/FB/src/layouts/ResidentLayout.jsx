import { useNavigate, useLocation } from "react-router-dom";
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {!isDashboard && (
              <button
                onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition hover:bg-gray-200 active:scale-90"
              >
                <FaArrowLeft className="h-4 w-4 text-gray-600" />
              </button>
            )}
            <h1
              className="cursor-pointer text-lg font-bold text-gray-800"
              onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
            >
              {isDashboard ? "Future Bin" : PAGE_TITLES[location.pathname] || "Resident"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {userName && (
              <span className="hidden text-sm font-medium text-gray-500 sm:block">{userName}</span>
            )}
            <Button variant="ghost" size="sm" icon={FaSignOutAlt} onClick={handleLogout}>Logout</Button>
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
    </div>
  );
};

export default ResidentLayout;
