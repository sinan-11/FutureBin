import { useNavigate } from "react-router-dom";
import { FaHome, FaSignOutAlt, FaTruck } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../components/Button";
import { logoutService } from "../services/authService";
import { ROUTES } from "../utils/constants";

const CollectorLayout = ({ children, userName }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out successfully");
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-white/10 bg-brand-700 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <h1 className="cursor-pointer text-xl font-bold text-white md:text-3xl" onClick={() => navigate(ROUTES.HOME)}>
            Future Bin
          </h1>
          <div className="flex items-center gap-4">
            {userName && (
              <span className="flex items-center gap-1 font-semibold text-white"><FaTruck /> {userName}</span>
            )}
            <Button variant="secondary" size="sm" icon={FaHome} onClick={() => navigate(ROUTES.HOME)}>Home</Button>
            <Button variant="danger" size="sm" icon={FaSignOutAlt} onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
    </div>
  );
};

export default CollectorLayout;
