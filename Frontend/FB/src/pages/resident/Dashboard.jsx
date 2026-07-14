import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRecycle, FaPlus, FaTrashAlt, FaTruck, FaWeight,
  FaMoneyBillWave, FaMapMarkerAlt, FaCheckCircle,
  FaTimesCircle, FaHourglass, FaHome, FaWallet, FaKey,
} from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import { getMyPickupsService, cancelPickupService, getPickupOtpService } from "../../services/pickupService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";
import WalletPanel from "../../components/WalletPanel";

const STATUS_BADGES = {
  broadcasting: { label: "Finding Collector", color: "bg-blue-100 text-blue-700", icon: FaHourglass },
  accepted: { label: "Collector on the way", color: "bg-indigo-100 text-indigo-700", icon: FaTruck },
  collector_arrived: { label: "Collector arrived", color: "bg-purple-100 text-purple-700", icon: FaMapMarkerAlt },
  collecting: { label: "Collecting waste", color: "bg-amber-100 text-amber-700", icon: FaTrashAlt },
  weight_verified: { label: "Weight verified", color: "bg-orange-100 text-orange-700", icon: FaWeight },
  payment_pending: { label: "Payment pending", color: "bg-yellow-100 text-yellow-700", icon: FaMoneyBillWave },
  paid: { label: "Paid", color: "bg-teal-100 text-teal-700", icon: FaCheckCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: FaCheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: FaTimesCircle },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600", icon: FaTimesCircle },
};

const STATUS_STEPS = [
  "broadcasting", "accepted", "collector_arrived", "collecting",
  "weight_verified", "payment_pending", "paid", "completed",
];

const ProgressBar = ({ currentStatus }) => {
  const idx = STATUS_STEPS.indexOf(currentStatus);
  if (idx < 0 || currentStatus === "completed") return null;
  const pct = ((idx + 1) / (STATUS_STEPS.length - 1)) * 100;
  return (
    <div className="h-1 bg-white/20">
      <div
        className="h-full bg-white rounded-r transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const POLL_INTERVAL = 10000;
const POLL_FALLBACK_DELAY = 5000;

const OTPModal = ({ requestId, onClose }) => {
  const [otpData, setOtpData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOtp = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPickupOtpService(requestId);
      setOtpData(res.data || res);
    } catch (error) {
      toast.error(getErrorMessage(error));
      onClose();
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchOtp();
  }, [fetchOtp]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <FaKey className="h-6 w-6 text-brand-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">OTP Verification</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <svg className="h-6 w-6 animate-spin text-brand-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : otpData?.otp ? (
          <>
            <p className="text-sm text-gray-400 mb-3">Share this OTP with your collector to complete the pickup.</p>
            <div className="mx-auto mb-4 inline-block rounded-xl bg-gray-50 px-6 py-3">
              <span className="text-3xl font-bold tracking-[0.3em] text-gray-800">{otpData.otp}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 py-4">Could not retrieve OTP. Please ask your collector to generate a new one.</p>
        )}
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  const [requests, setRequests] = useState({ current: [], completed: [], cancelled: [] });
  const [cancelling, setCancelling] = useState(null);
  const [showWallet, setShowWallet] = useState(false);
  const [otpModal, setOtpModal] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getMyPickupsService();
      setRequests(data);
    } catch { /* silent */ }
  }, []);

  const startPolling = useCallback(() => {
    if (!pollRef.current) {
      pollRef.current = setInterval(loadRequests, POLL_INTERVAL);
    }
  }, [loadRequests]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const { isConnected } = useSocket({
    residentEvents: {
      "pickup-accepted": useCallback((data) => {
        toast.info("Collector accepted your pickup!");
        loadRequests();
      }, [loadRequests]),

      "collector-arrived": useCallback((data) => {
        toast.info("Collector has arrived!");
        loadRequests();
      }, [loadRequests]),

      "otp-generated": useCallback((data) => {
        toast.success("Weight verified! OTP sent to your email.");
        loadRequests();
        const reqId = data?.request?._id;
        if (reqId) {
          setTimeout(() => setOtpModal(reqId), 500);
        }
      }, [loadRequests]),

      "weight-verified": useCallback((data) => {
        toast.success("Weight verified!");
        loadRequests();
        const reqId = data?.request?._id;
        if (reqId) {
          setTimeout(() => setOtpModal(reqId), 500);
        }
      }, [loadRequests]),

      "otp-regenerated": useCallback((data) => {
        toast.info("New OTP sent to your email.");
        loadRequests();
      }, [loadRequests]),

      "pickup-completed": useCallback((data) => {
        toast.success("Pickup completed!");
        loadRequests();
      }, [loadRequests]),

      "pickup-cancelled": useCallback((data) => {
        toast.info("A pickup request was cancelled.");
        loadRequests();
      }, [loadRequests]),

      "pickup-expired": useCallback((data) => {
        toast.warning("Pickup request expired.");
        loadRequests();
      }, [loadRequests]),
    },
    onReconnect: useCallback(() => {
      loadRequests();
      stopPolling();
    }, [loadRequests, stopPolling]),
  });

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (isConnected) {
      stopPolling();
    } else {
      pollTimeoutRef.current = setTimeout(() => {
        startPolling();
      }, POLL_FALLBACK_DELAY);
    }

    return () => stopPolling();
  }, [isConnected, startPolling, stopPolling]);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await cancelPickupService(id);
      toast.success("Request cancelled");
      loadRequests();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCancelling(null);
    }
  };

  const activeRequest = requests.current[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Top Bar ─── */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-sm">
              {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "R"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm leading-tight truncate">{user?.name || "Resident"}</p>
              <p className="text-xs text-gray-400">Resident</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <FaHome className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowWallet(true)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              Wallet
            </button>
            <button
              onClick={() => navigate(ROUTES.RESIDENT_MY_REQUESTS)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              Requests
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* ─── Uber-style "Where to?" bar ─── */}
        <div
          onClick={() => navigate(ROUTES.RESIDENT_CREATE_REQUEST)}
          className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <FaPlus className="text-brand-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Request a pickup</p>
            <p className="text-sm text-gray-400">Schedule waste collection from your location</p>
          </div>
          <FaTrashAlt className="text-gray-300" />
        </div>

        {/* ─── Active request (Uber ride tracking style) ─── */}
        {activeRequest ? (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Current Pickup</h2>
              <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden shadow-sm">
              {/* Status header */}
              <div className="bg-brand-600 text-white">
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const s = STATUS_BADGES[activeRequest.status];
                      const Icon = s?.icon || FaHourglass;
                      return <Icon className="h-5 w-5" />;
                    })()}
                    <p className="font-bold text-sm">
                      {STATUS_BADGES[activeRequest.status]?.label || activeRequest.status}
                    </p>
                  </div>
                </div>
                <ProgressBar currentStatus={activeRequest.status} />
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="mt-0.5 text-brand-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Pickup address</p>
                    <p className="font-medium text-gray-800 text-sm">{activeRequest.pickupAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FaRecycle className="mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Waste type</p>
                    <p className="font-medium text-gray-800 text-sm capitalize">{activeRequest.wasteType}</p>
                  </div>
                </div>

                {activeRequest.collector && (
                  <div className="flex items-start gap-3">
                    <FaTruck className="mt-0.5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Collector</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {activeRequest.collector.name}
                        {activeRequest.collector.collectorDetails?.phone && (
                          <span className="text-gray-400 ml-2">· {activeRequest.collector.collectorDetails.phone}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1"><FaWeight />{activeRequest.estimatedWeight} kg</span>
                  <span className="flex items-center gap-1"><FaMoneyBillWave />₹{activeRequest.estimatedPrice}</span>
                </div>

                {activeRequest.status === "weight_verified" && (
                  <button
                    onClick={() => setOtpModal(activeRequest._id)}
                    className="w-full rounded-xl bg-amber-50 border-2 border-amber-200 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 transition"
                  >
                    <span className="flex items-center justify-center gap-2"><FaKey className="h-4 w-4" /> View OTP</span>
                  </button>
                )}
                {(activeRequest.status === "broadcasting" || activeRequest.status === "accepted") && (
                  <button
                    onClick={() => handleCancel(activeRequest._id)}
                    disabled={cancelling === activeRequest._id}
                    className="w-full rounded-xl border-2 border-red-200 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {cancelling === activeRequest._id ? "Cancelling..." : "Cancel Request"}
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* ─── No active request ─── */
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Current Pickup</h2>
            <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                <FaRecycle className="h-6 w-6 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No active pickup</p>
              <p className="text-sm text-gray-400 mt-1">Tap "Request a pickup" above to schedule a waste collection.</p>
            </div>
          </section>
        )}

        {/* ─── Recent requests ─── */}
        {requests.completed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Pickups</h2>
            <div className="space-y-2">
              {requests.completed.slice(0, 3).map((req) => (
                <div key={req._id} className="rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 text-sm truncate">{req.pickupAddress}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <FaCheckCircle className="inline mr-1 text-green-500" />
                        Completed · {formatDateTime(req.completedAt)}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-400 ml-3">₹{req.estimatedPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {otpModal && <OTPModal requestId={otpModal} onClose={() => setOtpModal(null)} />}
      {showWallet && <WalletPanel onClose={() => setShowWallet(false)} />}
    </div>
  );
};

export default Dashboard;
