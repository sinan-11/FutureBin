import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaSignOutAlt, FaClock, FaTimes, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import { logoutService } from "../../services/authService";
import { getUsersService, approveCollectorService, rejectCollectorService } from "../../services/userService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

const PendingCollectors = () => {
  const navigate = useNavigate();
  const [pendingCollectors, setPendingCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomLabel, setZoomLabel] = useState("");

  async function loadPending() {
    try {
      const res = await getUsersService();
      const allUsers = res.data || [];
      setPendingCollectors(allUsers.filter((u) => u.role === "collector" && !u.isApproved));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setLoading(true); loadPending(); }, []);

  useEffect(() => {
    function handleKeyDown(e) { if (e.key === "Escape") { setZoomImage(null); setZoomLabel(""); } }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this collector?")) return;
    setActionLoading(id);
    try {
      await approveCollectorService(id);
      toast.success("Collector approved successfully");
      setPendingCollectors((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setActionLoading(null); }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this collector?")) return;
    setActionLoading(id);
    try {
      await rejectCollectorService(id);
      toast.success("Collector rejected");
      setPendingCollectors((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setActionLoading(null); }
  };

  const handleLogout = async () => { await logoutService(); toast.success("Logged out"); navigate(ROUTES.LOGIN); };

  const openZoom = (src, label) => { setZoomImage(src); setZoomLabel(label); };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-white/10 bg-brand-700 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <h1 className="text-xl font-bold text-white md:text-3xl">Future Bin Admin</h1>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={FaHome} onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)} />
            <Button variant="danger" size="sm" icon={FaSignOutAlt} onClick={handleLogout} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <h2 className="mb-8 text-3xl font-bold text-brand-700 md:text-4xl">
          <FaClock className="mr-3 inline-block" /> Pending Collectors
        </h2>

        <div className="rounded-xl border border-surface-200 bg-surface p-4 shadow-sm sm:p-6">
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent"></div></div>
          ) : pendingCollectors.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-surface-400">
              <FaClock className="text-4xl" />
              <p>No pending collectors</p>
            </div>
          ) : (
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
                  {pendingCollectors.map((collector) => (
                    <tr key={collector._id} className="border-b border-surface-100">
                      <td className="p-3 font-medium text-surface-800">{collector.name}</td>
                      <td className="p-3 text-surface-500">{collector.email}</td>
                      <td className="p-3 text-surface-500">{collector.collectorDetails?.phone || "N/A"}</td>
                      <td className="p-3 text-surface-500">{collector.collectorDetails?.vehicleNumber || "N/A"}</td>
                      <td className="p-3">
                        {collector.collectorDetails?.idProof ? (
                          <img src={collector.collectorDetails.idProof} alt="ID Proof"
                            className="h-16 w-16 cursor-pointer rounded-lg border border-surface-200 object-cover transition hover:opacity-80"
                            onClick={() => openZoom(collector.collectorDetails.idProof, "ID Proof")} />
                        ) : (<span className="text-surface-400">No Image</span>)}
                      </td>
                      <td className="p-3">
                        {collector.collectorDetails?.vehiclePhoto ? (
                          <img src={collector.collectorDetails.vehiclePhoto} alt="Vehicle"
                            className="h-16 w-16 cursor-pointer rounded-lg border border-surface-200 object-cover transition hover:opacity-80"
                            onClick={() => openZoom(collector.collectorDetails.vehiclePhoto, "Vehicle Photo")} />
                        ) : (<span className="text-surface-400">No Image</span>)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" icon={FaCheck}
                            onClick={() => handleApprove(collector._id)} disabled={actionLoading === collector._id}
                            loading={actionLoading === collector._id}>
                            {actionLoading === collector._id ? "Approving..." : "Approve"}
                          </Button>
                          <Button variant="danger" size="sm" icon={FaTimes}
                            onClick={() => handleReject(collector._id)} disabled={actionLoading === collector._id}>
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

export default PendingCollectors;
