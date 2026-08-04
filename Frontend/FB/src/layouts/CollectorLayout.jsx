import { useLocation } from "react-router-dom";
import { FaTachometerAlt, FaBroadcastTower, FaList } from "react-icons/fa";

import AppShell from "../components/AppShell";
import { ROUTES } from "../utils/constants";

const navItems = [
  { label: "Dashboard", path: ROUTES.COLLECTOR_DASHBOARD, icon: FaTachometerAlt },
  { label: "Available", path: ROUTES.COLLECTOR_AVAILABLE, icon: FaBroadcastTower },
  { label: "My Pickups", path: ROUTES.COLLECTOR_MY_PICKUPS, icon: FaList },
];

const CollectorLayout = ({ children, userName, title, subtitle, topbarActions }) => {
  const location = useLocation();

  const pageTitles = {
    [ROUTES.COLLECTOR_DASHBOARD]: "Dashboard",
    [ROUTES.COLLECTOR_AVAILABLE]: "Available Pickups",
    [ROUTES.COLLECTOR_MY_PICKUPS]: "My Pickups",
  };

  const resolveTitle = (t) => {
    if (t) return t;
    const pageTitle = pageTitles[location.pathname];
    return pageTitle || "Dashboard";
  };

  return (
    <AppShell
      userName={userName}
      title={resolveTitle(title)}
      subtitle={subtitle}
      navItems={navItems}
      topbarActions={topbarActions}
    >
      {children}
    </AppShell>
  );
};

export default CollectorLayout;
