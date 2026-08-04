import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaUserCheck, FaClock, FaTimes, FaCog, FaTachometerAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import StatCard from "../../components/StatCard";
import PageHeader from "../../components/PageHeader";
import Loader from "../../components/Loader";
import AdminLayout from "../../layouts/AdminLayout";
import { approveCollector, rejectCollector, getDashboardStats } from "../../services/dashboardService";
import { ROUTES } from "../../utils/constants";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ residents: 0, approvedCollectors: 0, pendingCollectors: 0, pendingCollectorList: [], subscriptionStats: null });
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

  const openZoom = (src, label) => { setZoomImage(src); setZoomLabel(label); };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") { setZoomImage(null); setZoomLabel(""); } };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <Loader fullScreen={false} label="Loading dashboard..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in pb-8">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Overview of your recycling community"
          icon={FaTachometerAlt}
        />

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <StatCard label="Residents" value={stats.residents} icon={FaUsers} accent="brand" onClick={() => navigate(ROUTES.ADMIN_RESIDENTS)} />
          <StatCard label="Approved Collectors" value={stats.approvedCollectors} icon={FaUserCheck} accent="teal" onClick={() => navigate(ROUTES.ADMIN_APPROVED_COLLECTORS)} />
          <StatCard label="Pending Collectors" value={stats.pendingCollectors} icon={FaClock} accent="amber" onClick={() => navigate(ROUTES.ADMIN_PENDING_COLLECTORS)} />
          <StatCard label="Manage Prices" value="₹" icon={FaCog} accent="violet" onClick={() => navigate(ROUTES.ADMIN_SETTINGS)} />
        </div>

        <div className="card mt-6 p-4 sm:p-6">
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
      </div>

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
    </AdminLayout>
  );
};

export default AdminDashboard;
