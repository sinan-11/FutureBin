import { useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaUserCheck,
  FaClock,
  FaCog,
  FaStar,
} from "react-icons/fa";

import AppShell from "../components/AppShell";
import { ROUTES } from "../utils/constants";

const navItems = [
  { label: "Dashboard", path: ROUTES.ADMIN_DASHBOARD, icon: FaTachometerAlt },
  { label: "Residents", path: ROUTES.ADMIN_RESIDENTS, icon: FaUsers },
  { label: "Collectors", path: ROUTES.ADMIN_APPROVED_COLLECTORS, icon: FaUserCheck },
  { label: "Pending", path: ROUTES.ADMIN_PENDING_COLLECTORS, icon: FaClock },
  { label: "Reviews", path: ROUTES.ADMIN_REVIEWS, icon: FaStar },
  { label: "Settings", path: ROUTES.ADMIN_SETTINGS, icon: FaCog },
];

const AdminLayout = ({ children, title, subtitle }) => {
  const location = useLocation();

  const pageTitles = {
    [ROUTES.ADMIN_DASHBOARD]: "Dashboard",
    [ROUTES.ADMIN_RESIDENTS]: "Residents",
    [ROUTES.ADMIN_APPROVED_COLLECTORS]: "Approved Collectors",
    [ROUTES.ADMIN_PENDING_COLLECTORS]: "Pending Collectors",
    [ROUTES.ADMIN_REVIEWS]: "Reviews",
    [ROUTES.ADMIN_SETTINGS]: "Settings",
  };

  const resolveTitle = (t) => {
    if (t) return t;
    const pageTitle = pageTitles[location.pathname];
    return pageTitle || "Admin";
  };

  return (
    <AppShell
      title={resolveTitle(title)}
      subtitle={subtitle}
      navItems={navItems}
    >
      {children}
    </AppShell>
  );
};

export default AdminLayout;
