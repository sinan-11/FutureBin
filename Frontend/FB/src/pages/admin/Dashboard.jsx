import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaUserCheck, FaClock, FaHome, FaSignOutAlt, FaTimes, FaCog } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import StatCard from "./StatCard";
import { approveCollector, rejectCollector, getDashboardStats } from "../../services/dashboardService";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ residents: 0, approvedCollectors: 0, pendingCollectors: 0, pendingCollectorList: [] });
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomLabel, setZoomLabel] = useState("");

  async function loadDashboard() {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setLoading(true); loadDashboard(); }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this collector?")) return;
    try {
      await approveCollector(id);
      toast.success("Collector approved successfully");
      setStats((prev) => ({
        ...prev, approvedCollectors: prev.approvedCollectors + 1, pendingCollectors: prev.pendingCollectors - 1,
        pendingCollectorList: prev.pendingCollectorList.filter((c) => c._id !== id),
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
        ...prev, pendingCollectors: prev.pendingCollectors - 1,
        pendingCollectorList: prev.pendingCollectorList.filter((c) => c._id !== id),
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    }
  };

  const handleLogout = async () => { await logoutService(); toast.success("Logged out"); navigate(ROUTES.LOGIN); };

  const openZoom = (src, label) => { setZoomImage(src); setZoomLabel(label); };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") { setZoomImage(null); setZoomLabel(""); } };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-white/10 bg-brand-700 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <h1 className="text-xl font-bold text-white md:text-3xl">Future Bin Admin</h1>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={FaCog} onClick={() => navigate(ROUTES.ADMIN_SETTINGS)} />
            <Button variant="secondary" size="sm" icon={FaHome} onClick={() => navigate(ROUTES.HOME)} />
            <Button variant="danger" size="sm" icon={FaSignOutAlt} onClick={handleLogout} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <h2 className="mb-8 text-3xl font-bold text-brand-700 md:text-4xl">Admin Dashboard</h2>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <StatCard title="Residents" value={stats.residents} icon={<FaUsers />} color="text-info" onClick={() => navigate(ROUTES.ADMIN_RESIDENTS)} />
          <StatCard title="Approved Collectors" value={stats.approvedCollectors} icon={<FaUserCheck />} color="text-success" onClick={() => navigate(ROUTES.ADMIN_APPROVED_COLLECTORS)} />
          <StatCard title="Pending Collectors" value={stats.pendingCollectors} icon={<FaClock />} color="text-warning" onClick={() => navigate(ROUTES.ADMIN_PENDING_COLLECTORS)} />
          <StatCard title="Manage Prices" value="₹" icon={<FaCog />} color="text-brand-600" onClick={() => navigate(ROUTES.ADMIN_SETTINGS)} />
        </div>

        <div className="mt-6 rounded-xl border border-surface-200 bg-surface p-4 shadow-sm sm:mt-10 sm:p-6">
          <h3 className="mb-4 text-lg font-bold text-surface-800 sm:text-2xl">Pending Collector Approvals</h3>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-surface-50">
                  <th className="p-3 text-left text-sm font-semibold text-surface-600">Name</th>
                  <th className="p-3 text-left text-sm font-semibold text-surface-600">Email</th>
                  <th className="p-3 text-left text-sm font-semibold text-surface-600">Phone</th>
                  <th className="p-3 text-left text-sm font-semibold text-surface-600">Vehicle No.</th>
                  <th className="p-3 text-left text-sm font-semibold text-surface-600">ID Proof</th>
                  <th className="p-3 text-left text-sm font-semibold text-surface-600">Vehicle Photo</th>
                  <th className="p-3 text-left text-sm font-semibold text-surface-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.pendingCollectorList.length === 0 ? (
                  <tr><td colSpan={7} className="p-5 text-center text-surface-400">No Pending Collectors</td></tr>
                ) : (
                  stats.pendingCollectorList.map((collector) => (
                    <tr key={collector._id} className="border-b border-surface-100">
                      <td className="p-3 font-medium text-surface-800">{collector.name}</td>
                      <td className="p-3 text-surface-500">{collector.email}</td>
                      <td className="p-3 text-surface-500">{collector.collectorDetails?.phone}</td>
                      <td className="p-3 text-surface-500">{collector.collectorDetails?.vehicleNumber}</td>
                      {["idProof", "vehiclePhoto"].map((field) => (
                        <td key={field} className="p-3">
                          {collector.collectorDetails?.[field] ? (
                            <img src={collector.collectorDetails[field]} alt={field} className="h-16 w-16 cursor-pointer rounded-lg border border-surface-200 object-cover transition hover:opacity-80"
                              onClick={() => openZoom(collector.collectorDetails[field], field === "idProof" ? "ID Proof" : "Vehicle Photo")} />
                          ) : (<span className="text-surface-400">No Image</span>)}
                        </td>
                      ))}
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" onClick={() => handleApprove(collector._id)}>Approve</Button>
                          <Button variant="danger" size="sm" onClick={() => handleReject(collector._id)}>Reject</Button>
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

      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setZoomImage(null); setZoomLabel(""); }}>
          <button className="absolute right-4 top-4 text-3xl text-white/80 hover:text-white" onClick={() => { setZoomImage(null); setZoomLabel(""); }}>
            <FaTimes />
          </button>
          <div className="max-w-[90vw] rounded-xl bg-surface p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-center text-lg font-semibold text-surface-800">{zoomLabel || "Document Preview"}</h3>
            <img src={zoomImage} alt="Preview" className="max-h-[70vh] w-auto rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
