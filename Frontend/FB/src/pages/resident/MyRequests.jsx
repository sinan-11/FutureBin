import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaPlus, FaCheckCircle, FaTimesCircle,
  FaHourglass, FaTruck, FaWeight,
  FaMoneyBillWave, FaKey, FaCalendarAlt, FaRecycle,
  FaLeaf, FaHome, FaSignOutAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import { getMyPickupsService, cancelPickupService, getPickupOtpService } from "../../services/pickupService";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";

const STATUS_CONFIG = {
  broadcasting: { label: "Finding Collector", dot: "bg-blue-500" },
  accepted: { label: "Accepted", dot: "bg-indigo-500" },
  collector_arrived: { label: "Collector Arrived", dot: "bg-purple-500" },
  weight_verified: { label: "Weight Verified", dot: "bg-orange-500" },
  completed: { label: "Completed", dot: "bg-green-500" },
  cancelled: { label: "Cancelled", dot: "bg-red-500" },
  expired: { label: "Expired", dot: "bg-gray-400" },
};

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

  useEffect(() => { fetchOtp(); }, [fetchOtp]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-in rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-50 to-brand-100">
          <FaKey className="h-6 w-6 text-brand-600" />
        </div>
        <h3 className="mb-1 text-lg font-bold text-gray-800">OTP Verification</h3>
        <p className="mb-4 text-sm text-gray-400">Share this code with your collector to complete the pickup.</p>
        {loading ? (
          <div className="flex justify-center py-4">
            <svg className="h-6 w-6 animate-spin text-brand-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : otpData?.otp ? (
          <div className="mx-auto inline-block rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 px-8 py-4 shadow-inner">
            <span className="text-4xl font-bold tracking-[0.35em] text-gray-800">{otpData.otp}</span>
          </div>
        ) : (
          <p className="py-4 text-sm text-gray-400">Could not retrieve OTP. Ask your collector to generate a new one.</p>
        )}
        <button onClick={onClose} className="mt-5 w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 active:scale-[0.97]">
          Close
        </button>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value, highlight }) => (
  <div className="flex items-center gap-3">
    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${highlight ? "bg-brand-50" : "bg-gray-50"}`}>
      <Icon className={`h-3 w-3 ${highlight ? "text-brand-500" : "text-gray-400"}`} />
    </div>
    <span className="text-sm text-gray-400">{label}</span>
    <span className={`ml-auto text-sm font-semibold ${highlight ? "text-brand-600" : "text-gray-800"}`}>{value}</span>
  </div>
);

const RequestCard = ({ request, onCancel, cancelling }) => {
  const config = STATUS_CONFIG[request.status] || { label: request.status, dot: "bg-gray-300" };
  const canCancel = request.status === "broadcasting" || request.status === "accepted";
  const [showOtp, setShowOtp] = useState(false);

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:border-gray-200 hover:shadow-lg">
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className={`relative flex h-2.5 w-2.5 items-center justify-center ${config.dot.replace("bg-", "bg-")}`}>
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dot}`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.dot}`} />
          </span>
          <span className="text-sm font-semibold text-gray-700">{config.label}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            <FaRecycle className="h-3 w-3" />
            {capitalize(request.wasteType)}
          </span>
          {request.paymentMethod && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${request.paymentMethod === "wallet" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
              <FaMoneyBillWave className="h-3 w-3" />
              {capitalize(request.paymentMethod)}
            </span>
          )}
          {request.paymentStatus === "awaiting_extra_payment" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              Extra Payment Due
            </span>
          )}
        </div>
        {request.status === "weight_verified" && request.paymentStatus !== "awaiting_extra_payment" && (request.paymentMethod === "wallet" || request.cashConfirmed) && (
          <button
            onClick={() => setShowOtp(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100 active:scale-95"
          >
            <FaKey className="h-3 w-3" /> View OTP
          </button>
        )}
        {request.status === "weight_verified" && request.paymentStatus === "awaiting_extra_payment" && (
          <span className="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
            <FaMoneyBillWave className="h-3 w-3" /> Pay ₹{request.extraPaymentAmount}
          </span>
        )}
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50">
            <FaCalendarAlt className="h-3.5 w-3.5 text-brand-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-400">Pickup Address</p>
            <p className="text-sm font-semibold text-gray-800 leading-snug">{request.pickupAddress}</p>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50/80 p-4">
          <div className="space-y-2.5">
            <InfoRow icon={FaWeight} label="Estimated Weight" value={`${request.estimatedWeight} kg`} />
            {request.actualWeight && (
              <InfoRow icon={FaWeight} label="Actual Weight" value={`${request.actualWeight} kg`} highlight />
            )}
            <InfoRow icon={FaMoneyBillWave} label="Estimated Price" value={`₹${request.estimatedPrice}`} />
            {request.finalPrice && (
              <InfoRow icon={FaMoneyBillWave} label="Final Amount" value={`₹${request.finalPrice}`} highlight />
            )}
            {request.scheduledAt && (
              <InfoRow icon={FaCalendarAlt} label="Scheduled For" value={formatDateTime(request.scheduledAt)} />
            )}
          </div>
        </div>

        {request.collector && (
          <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/50 to-white px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100">
              <FaTruck className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-brand-500">Assigned Collector</p>
              <p className="text-sm font-semibold text-brand-700">
                {request.collector.name}
                {request.collector.collectorDetails?.phone && (
                  <span className="font-normal text-brand-400"> · {request.collector.collectorDetails.phone}</span>
                )}
              </p>
            </div>
          </div>
        )}

        {request.description && (
          <div className="border-l-2 border-gray-200 pl-3">
            <p className="text-sm italic text-gray-400 leading-relaxed">{request.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-300">
            {formatDateTime(request.createdAt)}
            {request.completedAt && <> · {formatDateTime(request.completedAt)}</>}
          </p>
          {canCancel && (
            <button
              onClick={() => onCancel(request._id)}
              disabled={cancelling}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 active:scale-95"
            >
              {cancelling ? "Cancelling..." : "Cancel Request"}
            </button>
          )}
        </div>
      </div>

      {showOtp && <OTPModal requestId={request._id} onClose={() => setShowOtp(false)} />}
    </div>
  );
};

const POLL_INTERVAL = 10000;
const POLL_FALLBACK_DELAY = 5000;

const MyRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState({ current: [], completed: [], cancelled: [] });
  const [cancelling, setCancelling] = useState(null);
  const [otpModal, setOtpModal] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getMyPickupsService();
      setRequests(data);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
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
        const req = data?.request;
        if (req && req.paymentMethod !== "cash") {
          setTimeout(() => setOtpModal(req._id), 500);
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

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out");
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-700/95 shadow-lg shadow-brand-900/20 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition group-hover:bg-white/25 group-hover:scale-105">
              <FaLeaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white md:text-2xl">
              Future<span className="text-brand-200">Bin</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Link
              to={ROUTES.RESIDENT_DASHBOARD}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaHome className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full p-2 text-white/50 transition hover:bg-red-500/20 hover:text-red-300"
              title="Logout"
            >
              <FaSignOutAlt size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">My Requests</h1>
          <p className="mt-1 text-sm text-gray-400">
            {requests.current.length > 0
              ? `${requests.current.length} active request${requests.current.length > 1 ? "s" : ""}`
              : "No active requests"}
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.RESIDENT_CREATE_REQUEST)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-200 transition hover:from-brand-700 hover:to-brand-600 hover:shadow-md hover:shadow-brand-300 active:scale-95"
        >
          <FaPlus className="h-3.5 w-3.5" />
          New Request
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { key: "current", title: "Active", icon: FaHourglass, empty: "No active pickup requests" },
            { key: "completed", title: "Completed", icon: FaCheckCircle, empty: "No completed pickups yet" },
            { key: "cancelled", title: "Cancelled", icon: FaTimesCircle, empty: "No cancelled requests" },
          ].map(({ key, title, icon: Icon, empty }) => {
            const items = requests[key];
            if (items.length === 0 && key !== "current") return null;
            return (
              <section key={key}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    key === "current" ? "bg-blue-50 text-blue-600" :
                    key === "completed" ? "bg-green-50 text-green-600" :
                    "bg-red-50 text-red-500"
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">{title}</h2>
                  {items.length > 0 && (
                    <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      key === "current" ? "bg-blue-50 text-blue-600" :
                      key === "completed" ? "bg-green-50 text-green-600" :
                      "bg-red-50 text-red-500"
                    }`}>
                      {items.length}
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  {items.length > 0 ? (
                    items.map((req) => (
                      <RequestCard key={req._id} request={req} onCancel={handleCancel} cancelling={cancelling === req._id} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-sm text-gray-300">
                      <Icon className="mb-2 h-8 w-8 text-gray-200" />
                      {empty}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {otpModal && <OTPModal requestId={otpModal} onClose={() => setOtpModal(null)} />}
      </main>
    </div>
  );
};

export default MyRequests;
