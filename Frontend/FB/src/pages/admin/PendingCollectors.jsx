import { useEffect, useState } from "react";
import { FaClock, FaTimes, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { ListSkeleton } from "../../components/Skeleton";
import AdminLayout from "../../layouts/AdminLayout";
import { getUsersService, approveCollectorService, rejectCollectorService } from "../../services/userService";
import { getErrorMessage } from "../../utils/helpers";

const PendingCollectors = () => {
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

  const openZoom = (src, label) => { setZoomImage(src); setZoomLabel(label); };

  return (
    <AdminLayout>
      <div className="animate-fade-in pb-8">
        <PageHeader
          title="Pending Collectors"
          subtitle="Collectors waiting for approval"
          icon={FaClock}
        />

        <div className="card p-4 sm:p-6">
          {loading ? (
            <ListSkeleton count={5} />
          ) : pendingCollectors.length === 0 ? (
            <EmptyState
              icon={FaClock}
              title="No pending collectors"
              description="New collector registrations waiting for review will appear here."
            />
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

export default PendingCollectors;
