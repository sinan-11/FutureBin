import { useNavigate } from "react-router-dom";
import { FaHome, FaMapMarkerAlt, FaTrashAlt, FaUser, FaSignOutAlt, FaRecycle, FaRegCalendarAlt, FaShieldAlt, FaEnvelope, FaIdBadge, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import Card from "../../components/Card";
import useAuth from "../../hooks/useAuth";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out successfully");
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface to-surface-50">
      <header className="bg-gradient-to-r from-brand-700 to-brand-500 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8 md:py-5">
          <h1 className="cursor-pointer text-xl font-bold tracking-tight text-white md:text-3xl" onClick={() => navigate(ROUTES.HOME)}>
            Future Bin
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={FaHome} onClick={() => navigate(ROUTES.HOME)}>Home</Button>
            <Button variant="danger" size="sm" icon={FaSignOutAlt} onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 p-6 text-white shadow-lg md:p-8">
          <h2 className="text-2xl font-bold md:text-4xl">Welcome back, {user?.name?.split(" ")[0] || "there"}!</h2>
          <p className="mt-2 text-brand-100">Here is an overview of your account.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-bold text-surface-800">Profile</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-surface-50 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                  {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "R"}
                </div>
                <div>
                  <p className="text-lg font-bold text-surface-800">{user?.name}</p>
                  <p className="text-sm text-surface-400">Resident</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  <FaEnvelope className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-400">Email</p>
                    <p className="text-sm font-medium text-surface-700">{user?.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  <FaIdBadge className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-400">Role</p>
                    <p className="text-sm font-medium capitalize text-surface-700">{user?.role || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  {user?.emailVerified ? <FaCheckCircle className="h-4 w-4 text-green-500" /> : <FaTimesCircle className="h-4 w-4 text-red-500" />}
                  <div>
                    <p className="text-xs text-surface-400">Email Verified</p>
                    <p className={`text-sm font-medium ${user?.emailVerified ? "text-green-600" : "text-red-600"}`}>
                      {user?.emailVerified ? "Verified" : "Not Verified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  <FaRegCalendarAlt className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-400">Member Since</p>
                    <p className="text-sm font-medium text-surface-700">{user?.createdAt ? formatDate(user.createdAt) : "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-bold text-surface-800">Quick Actions</h3>
            <div className="space-y-3">
              <button className="flex w-full items-center gap-3 rounded-xl border border-surface-200 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                <div className="rounded-lg bg-brand-50 p-3">
                  <FaTrashAlt className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-surface-700">Request Collection</p>
                  <p className="text-xs text-surface-400">Schedule a waste pickup</p>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl border border-surface-200 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <FaMapMarkerAlt className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-surface-700">Update Location</p>
                  <p className="text-xs text-surface-400">Change pickup address</p>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl border border-surface-200 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                <div className="rounded-lg bg-violet-50 p-3">
                  <FaUser className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-surface-700">View Profile</p>
                  <p className="text-xs text-surface-400">Manage your account</p>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl border border-surface-200 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                <div className="rounded-lg bg-amber-50 p-3">
                  <FaRecycle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-surface-700">Recycling Guide</p>
                  <p className="text-xs text-surface-400">Learn waste segregation</p>
                </div>
              </button>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="mb-4 text-lg font-bold text-surface-800">Collection Requests</h3>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
                <FaRecycle className="h-7 w-7 text-surface-300" />
              </div>
              <p className="text-lg font-semibold text-surface-500">No requests yet</p>
              <p className="mt-1 max-w-sm text-sm text-surface-400">When you submit collection requests, they will appear here.</p>
              <Button className="mt-6" size="sm" icon={FaTrashAlt}>Request Your First Collection</Button>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-bold text-surface-800">Notifications</h3>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
                <FaShieldAlt className="h-7 w-7 text-surface-300" />
              </div>
              <p className="text-lg font-semibold text-surface-500">All clear</p>
              <p className="mt-1 max-w-sm text-sm text-surface-400">No notifications yet. We will notify you about collection updates and important updates.</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
