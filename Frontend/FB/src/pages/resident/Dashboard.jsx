import { useNavigate } from "react-router-dom";
import { FaHome, FaMapMarkerAlt, FaTrashAlt, FaUser, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import useAuth from "../../hooks/useAuth";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out successfully");
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <header className="bg-green-600 shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <h1
            className="cursor-pointer text-3xl font-bold text-white"
            onClick={() => navigate(ROUTES.HOME)}
          >
            Future Bin
          </h1>

          <div className="flex items-center gap-4">
            <Button
              className="flex w-auto items-center gap-2 bg-white text-green-600 hover:bg-gray-100"
              onClick={() => navigate(ROUTES.HOME)}
            >
              <FaHome />
              Home
            </Button>

            <Button
              className="flex w-auto items-center gap-2 bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-green-700">
            Welcome back, {user?.name} 👋
          </h2>

          <p className="mt-2 text-gray-600">
            Manage your waste collection requests and profile.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-gray-500">Collection Requests</p>
            <h3 className="mt-2 text-4xl font-bold text-green-600">5</h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-gray-500">Completed</p>
            <h3 className="mt-2 text-4xl font-bold text-blue-600">4</h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-gray-500">Pending</p>
            <h3 className="mt-2 text-4xl font-bold text-orange-500">1</h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-gray-500">Reward Points</p>
            <h3 className="mt-2 text-4xl font-bold text-purple-600">120</h3>
          </div>
        </div>

        {/* User Details */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-4 text-xl font-bold">Profile</h3>

            <div className="space-y-3">
              <p>
                <strong>Name:</strong> {user?.name}
              </p>

              <p>
                <strong>Email:</strong> {user?.email}
              </p>

              <p className="capitalize">
                <strong>Role:</strong> {user?.role}
              </p>

              <p>
                <strong>Email Verified:</strong>{" "}
                <span
                  className={
                    user?.emailVerified
                      ? "font-semibold text-green-600"
                      : "font-semibold text-red-600"
                  }
                >
                  {user?.emailVerified ? "Verified" : "Not Verified"}
                </span>
              </p>
            </div>
          </div>

          {/* Collection Status */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-4 text-xl font-bold">
              Latest Collection
            </h3>

            <div className="space-y-3">
              <p>
                <strong>Status:</strong>{" "}
                <span className="font-semibold text-orange-500">
                  Pending
                </span>
              </p>

              <p>
                <strong>Collector:</strong> Not Assigned
              </p>

              <p>
                <strong>Requested:</strong> Today
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-4 text-xl font-bold">
              Notifications
            </h3>

            <ul className="space-y-2 text-gray-600">
              <li>🟢 Collection request submitted.</li>
              <li>♻️ Keep recyclable waste separated.</li>
              <li>📍 Update your location if you move.</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 rounded-xl bg-white p-6 shadow">
          <h3 className="mb-6 text-2xl font-bold">
            Quick Actions
          </h3>

          <div className="flex flex-wrap gap-4">
            <Button
              className="flex w-auto items-center gap-2"
            >
              <FaMapMarkerAlt />
              Update Location
            </Button>

            <Button
              className="flex w-auto items-center gap-2"
            >
              <FaTrashAlt />
              Request Collection
            </Button>

            <Button
              className="flex w-auto items-center gap-2"
            >
              <FaUser />
              View Profile
            </Button>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="mt-10 rounded-xl bg-white p-6 shadow">
          <h3 className="mb-6 text-2xl font-bold">
            Recent Collection Requests
          </h3>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Waste Type</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b">
                <td className="p-3">30 Jun 2026</td>
                <td className="p-3">Plastic</td>
                <td className="p-3 text-orange-500">Pending</td>
              </tr>

              <tr className="border-b">
                <td className="p-3">25 Jun 2026</td>
                <td className="p-3">Organic</td>
                <td className="p-3 text-green-600">Completed</td>
              </tr>

              <tr>
                <td className="p-3">20 Jun 2026</td>
                <td className="p-3">Mixed Waste</td>
                <td className="p-3 text-green-600">Completed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;