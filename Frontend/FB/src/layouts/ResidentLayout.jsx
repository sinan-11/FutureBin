import { useLocation } from "react-router-dom";
import { FaPlus, FaList, FaTachometerAlt, FaCalendarAlt } from "react-icons/fa";

import AppShell from "../components/AppShell";
import { ROUTES } from "../utils/constants";

const navItems = [
  { label: "Dashboard", path: ROUTES.RESIDENT_DASHBOARD, icon: FaTachometerAlt },
  { label: "New Request", path: ROUTES.RESIDENT_CREATE_REQUEST, icon: FaPlus },
  { label: "My Requests", path: ROUTES.RESIDENT_MY_REQUESTS, icon: FaList },
  { label: "Subscriptions", path: ROUTES.RESIDENT_MY_SUBSCRIPTIONS, icon: FaCalendarAlt },
];

const ResidentLayout = ({ children, userName, title = "Dashboard", subtitle }) => {
  const location = useLocation();

  const pageTitles = {
    [ROUTES.RESIDENT_DASHBOARD]: "Dashboard",
    [ROUTES.RESIDENT_CREATE_REQUEST]: "New Pickup Request",
    [ROUTES.RESIDENT_MY_REQUESTS]: "My Requests",
    [ROUTES.RESIDENT_CREATE_SUBSCRIPTION]: "Create Subscription",
    [ROUTES.RESIDENT_MY_SUBSCRIPTIONS]: "My Subscriptions",
    [ROUTES.RESIDENT_EDIT_SUBSCRIPTION]: "Edit Subscription",
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
    >
      {children}
    </AppShell>
  );
};

export default ResidentLayout;
