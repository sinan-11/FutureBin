import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaUserCheck,
  FaClock,
  FaHome,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import StatCard from "../../pages/admin/StatCard";
import {
  approveCollector,
  rejectCollector,
  getDashboardStats,
} from "../../services/dashboardService";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    residents: 0,
    approvedCollectors: 0,
    pendingCollectors: 0,
    pendingCollectorList: [],
  });

  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomLabel, setZoomLabel] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this collector?")) return;

    try {
      await approveCollector(id);

      toast.success("Collector approved successfully");

      setStats((prev) => ({
        ...prev,
        approvedCollectors: prev.approvedCollectors + 1,
        pendingCollectors: prev.pendingCollectors - 1,
        pendingCollectorList: prev.pendingCollectorList.filter(
          (c) => c._id !== id
        ),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this collector?")) return;

    try {
      await rejectCollector(id);

      toast.success("Collector rejected");

      setStats((prev) => ({
        ...prev,
        pendingCollectors: prev.pendingCollectors - 1,
        pendingCollectorList: prev.pendingCollectorList.filter(
          (c) => c._id !== id
        ),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    }
  };

  const handleLogout = async () => {
    await logoutService();

    toast.success("Logged out");

    navigate(ROUTES.LOGIN);
  };

  const openZoom = (src, label) => {
    setZoomImage(src);
    setZoomLabel(label);
  };

  const closeZoom = () => {
    setZoomImage(null);
    setZoomLabel("");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}

      <header className="bg-green-700 shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">

          <h1 className="text-3xl font-bold text-white">
            Future Bin Admin
          </h1>

          <div className="flex gap-3">

            <Button
              className="w-auto bg-white text-green-700 hover:bg-gray-100"
              onClick={() => navigate(ROUTES.HOME)}
            >
              <FaHome />
            </Button>

            <Button
              className="w-auto bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
            </Button>

          </div>

        </div>
      </header>

      <main className="mx-auto max-w-7xl p-8">

        <h2 className="mb-8 text-4xl font-bold text-green-700">
          Admin Dashboard
        </h2>

        {/* Cards */}

        <div className="grid gap-6 md:grid-cols-3">

          <StatCard
            title="Residents"
            value={stats.residents}
            icon={<FaUsers />}
            color="text-blue-600"
          />

          <StatCard
            title="Approved Collectors"
            value={stats.approvedCollectors}
            icon={<FaUserCheck />}
            color="text-green-600"
          />

          <StatCard
            title="Pending Collectors"
            value={stats.pendingCollectors}
            icon={<FaClock />}
            color="text-orange-500"
          />

        </div>

        {/* Pending Collectors */}

        <div className="mt-10 rounded-xl bg-white p-6 shadow">

          <h3 className="mb-5 text-2xl font-bold">
            Pending Collector Approvals
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Vehicle No.</th>
                  <th className="p-3 text-left">ID Proof</th>
                  <th className="p-3 text-left">Vehicle Photo</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {stats.pendingCollectorList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-5 text-center text-gray-500"
                    >
                      No Pending Collectors
                    </td>
                  </tr>
                ) : (
                  stats.pendingCollectorList.map((collector) => (
                    <tr key={collector._id} className="border-b">

                      <td className="p-3">
                        {collector.name}
                      </td>

                      <td className="p-3">
                        {collector.email}
                      </td>

                      <td className="p-3">
                        {collector.collectorDetails?.phone}
                      </td>

                      <td className="p-3">
                        {collector.collectorDetails?.vehicleNumber}
                      </td>

                      <td className="p-3">
                        {collector.collectorDetails?.idProof ? (
                          <img
                            src={collector.collectorDetails.idProof}
                            alt="ID Proof"
                            className="h-20 w-20 cursor-pointer rounded border object-cover transition hover:opacity-80"
                            onClick={() =>
                              openZoom(
                                collector.collectorDetails.idProof,
                                "ID Proof"
                              )
                            }
                          />
                        ) : (
                          <span className="text-gray-500">
                            No Image
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {collector.collectorDetails?.vehiclePhoto ? (
                          <img
                            src={collector.collectorDetails.vehiclePhoto}
                            alt="Vehicle"
                            className="h-20 w-20 cursor-pointer rounded border object-cover transition hover:opacity-80"
                            onClick={() =>
                              openZoom(
                                collector.collectorDetails.vehiclePhoto,
                                "Vehicle Photo"
                              )
                            }
                          />
                        ) : (
                          <span className="text-gray-500">
                            No Image
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            className="w-auto bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              handleApprove(collector._id)
                            }
                          >
                            Approve
                          </Button>

                          <Button
                            className="w-auto bg-red-600 hover:bg-red-700"
                            onClick={() =>
                              handleReject(collector._id)
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeZoom}
        >
          <button
            className="absolute right-6 top-6 text-3xl text-white hover:text-gray-300"
            onClick={closeZoom}
          >
            <FaTimes />
          </button>

          <div
            className="rounded-lg bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-center text-xl font-semibold">
              {zoomLabel || "Document Preview"}
            </h3>

            <img
              src={zoomImage}
              alt="Preview"
              className="max-h-[80vh] max-w-[80vw] object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;