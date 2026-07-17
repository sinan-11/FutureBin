import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaBars, FaTimes, FaTachometerAlt, FaUsers, FaUserCheck, FaClock, FaSignOutAlt, FaCog } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../components/Button";
import { logoutService } from "../services/authService";
import { ROUTES } from "../utils/constants";

const AdminLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out");
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { label: "Dashboard", icon: <FaTachometerAlt />, path: ROUTES.ADMIN_DASHBOARD },
    { label: "Residents", icon: <FaUsers />, path: ROUTES.ADMIN_RESIDENTS },
    { label: "Approved Collectors", icon: <FaUserCheck />, path: ROUTES.ADMIN_APPROVED_COLLECTORS },
    { label: "Pending Collectors", icon: <FaClock />, path: ROUTES.ADMIN_PENDING_COLLECTORS },
    { label: "Settings", icon: <FaCog />, path: ROUTES.ADMIN_SETTINGS },
  ];

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="cursor-pointer text-2xl font-bold text-white" onClick={() => navigate(ROUTES.HOME)}>Future Bin</h1>
          <p className="mt-1 text-sm text-brand-200">Admin Panel</p>
        </div>
        <button className="text-white md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
          <FaTimes size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-brand-100 transition hover:bg-brand-600 hover:text-white"
            onClick={() => setSidebarOpen(false)}>
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4">
        <Button variant="ghost" size="md" icon={FaSignOutAlt} onClick={handleLogout}
          className="w-full justify-start !text-brand-100 hover:!bg-danger hover:!text-white">
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface-50">
      <aside className="hidden w-64 flex-col bg-brand-700 md:flex">{sidebarContent}</aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-brand-700">{sidebarContent}</aside>
        </div>
      )}

      <main className="flex-1">
        <div className="flex items-center gap-3 border-b border-white/10 bg-brand-700 px-4 py-3 text-white md:hidden">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><FaBars size={20} /></button>
          <h1 className="text-lg font-bold">Future Bin Admin</h1>
        </div>
        <div className="p-4 md:p-8">
          {title && <h2 className="mb-6 text-3xl font-bold text-brand-700">{title}</h2>}
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
