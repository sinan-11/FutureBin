import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaRecycle, FaPlus, FaTrashAlt, FaTruck, FaWeight,
  FaMoneyBillWave, FaMapMarkerAlt, FaCheckCircle,
  FaTimesCircle, FaHourglass, FaHome, FaWallet, FaKey, FaMap, FaComments, FaLeaf, FaSignOutAlt, FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import { getMyPickupsService, cancelPickupService, getPickupOtpService, confirmExtraPaymentService, payExtraWalletService } from "../../services/pickupService";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDateTime, capitalize, formatCurrency } from "../../utils/helpers";
import { isValidCoordinates } from "../../utils/map";
import { playNotificationSound } from "../../utils/sound";
import WalletPanel from "../../components/WalletPanel";
import LiveCollectorTracker from "../../components/map/LiveCollectorTracker";
import ChatPanel from "../../components/ChatPanel";

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

const ExtraPaymentModal = ({ request, onClose, onSuccess }) => {
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState(null);

  const handlePayFromWallet = async () => {
    setPaying(true);
    setMethod("wallet");
    try {
      await payExtraWalletService(request._id);
      toast.success("Extra payment deducted from wallet. OTP sent.");
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Payment failed";
      toast.error(msg);
    } finally {
      setPaying(false);
      setMethod(null);
    }
  };

  const handlePayFromRazorpay = async () => {
    if (!request.extraPaymentOrderId || !request.extraPaymentAmount || !request.razorpayKeyId) {
      toast.error("Razorpay not available. Please try wallet payment.");
      return;
    }
    setPaying(true);
    setMethod("razorpay");

    try {
      const options = {
        key: request.razorpayKeyId,
        amount: Math.round(request.extraPaymentAmount * 100),
        currency: "INR",
        name: "Future Bin",
        description: "Extra payment for pickup",
        order_id: request.extraPaymentOrderId,
        handler: async (response) => {
          try {
            await confirmExtraPaymentService(request._id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment verified! OTP has been sent.");
            onSuccess();
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#16a34a" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setPaying(false);
      setMethod(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
          <FaMoneyBillWave className="h-6 w-6 text-orange-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Extra Payment Required</h3>
        <p className="text-sm text-gray-500 mb-4">
          The actual weight ({request.actualWeight}kg) exceeds the estimated weight. You need to pay an additional amount.
        </p>
        <div className="rounded-xl bg-gray-50 p-4 mb-4">
          <p className="text-xs text-gray-400">Additional amount</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(request.extraPaymentAmount)}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayFromWallet}
            disabled={paying}
            className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {paying && method === "wallet" ? "Paying..." : "Pay from Wallet"}
          </button>
          {request.razorpayKeyId && request.extraPaymentOrderId && (
            <button
              onClick={handlePayFromRazorpay}
              disabled={paying}
              className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {paying && method === "razorpay" ? "Paying..." : "Pay Online"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CancelConfirmationModal = ({ request, onClose, onConfirm }) => {
  const [cancelling, setCancelling] = useState(false);

  const isBeforeAcceptance = request.status === "broadcasting";
  const isWalletPayment = request.paymentMethod === "wallet";
  const feeApplies = !isBeforeAcceptance && isWalletPayment;

  const cancellationFee = feeApplies
    ? Math.max(
        Math.round((request.estimatedPrice * 10) / 100 * 100) / 100,
        5
      )
    : 0;

  const handleConfirm = async () => {
    setCancelling(true);
    try {
      await onConfirm();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <FaTimesCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Cancel Pickup?</h3>
        {feeApplies ? (
          <>
            <p className="text-sm text-gray-500 mb-3">
              A collector has already been assigned to this pickup. Cancelling now will incur a cancellation fee.
            </p>
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-4">
              <p className="text-xs text-red-400">Cancellation fee</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(cancellationFee)}</p>
              <p className="text-xs text-red-300 mt-1">This will be deducted from your wallet</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            {isBeforeAcceptance
              ? "Are you sure you want to cancel this pickup request? Your reserved amount will be released."
              : "Are you sure you want to cancel this pickup request?"}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={cancelling}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            Keep Request
          </button>
          <button
            onClick={handleConfirm}
            disabled={cancelling}
            className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
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
  const debounceTimerRef = useRef(null);
  const lastFetchRef = useRef(0);
  const activeRequestRef = useRef(null);
  const doFetchRouteRef = useRef(null);
  const nearbyNotifiedRef = useRef(new Set());

  const [requests, setRequests] = useState({ current: [], completed: [], cancelled: [] });
  const [cancelling, setCancelling] = useState(null);
  const [showWallet, setShowWallet] = useState(false);
  const [otpModal, setOtpModal] = useState(null);
  const [extraPaymentModal, setExtraPaymentModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [collectorLocation, setCollectorLocation] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getMyPickupsService();
      setRequests(data);
    } catch { /* silent */ }
  }, []);

  const fetchRouteBetween = useCallback(async (fromCoords, toCoords) => {
    try {
      const from = [fromCoords[1], fromCoords[0]];
      const to = [toCoords[1], toCoords[0]];
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return null;
      const route = data.routes[0];
      return {
        distance: (route.distance / 1000).toFixed(1),
        duration: Math.ceil(route.duration / 60),
        durationSec: route.duration,
        geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      };
    } catch (error) {
      console.error("[TRACKING] fetchRouteBetween failed:", error);
      return null;
    }
  }, []);

  doFetchRouteRef.current = async (collectorLoc, pickupCoords) => {
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) return;
    lastFetchRef.current = now;

    const result = await fetchRouteBetween(
      [collectorLoc.longitude, collectorLoc.latitude],
      pickupCoords
    );

    if (result) {
      setRouteData(result);

      if (result.durationSec <= 300 && activeRequestRef.current) {
        const pickupId = activeRequestRef.current._id;
        if (!nearbyNotifiedRef.current.has(pickupId)) {
          nearbyNotifiedRef.current.add(pickupId);
          toast.info(
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <FaTruck className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Collector is almost here!</p>
                <p className="text-sm text-gray-500">ETA: {result.duration} min</p>
              </div>
            </div>,
            { autoClose: 8000 }
          );
          playNotificationSound();
        }
      }
    } else {
      console.error("[TRACKING] Route fetch returned null, keeping previous routeData");
    }
  };

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

  const { socketRef, isConnected } = useSocket({
    residentEvents: {
      "pickup-accepted": useCallback((data) => {
        toast.info("Collector accepted your pickup!");
        loadRequests();
      }, [loadRequests]),

      "collector-arrived": useCallback((data) => {
        toast.info("Collector has arrived!");
        setCollectorLocation(null);
        setRouteData(null);
        setShowTracker(false);
        loadRequests();
      }, [loadRequests]),

      "collector-location": useCallback((data) => {
        const { pickupId, location } = data;
        const current = activeRequestRef.current;
        if (!current || current._id !== pickupId) return;

        setCollectorLocation(location);

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
          const pickupCoords = current.location?.coordinates;
          if (pickupCoords && doFetchRouteRef.current) {
            doFetchRouteRef.current(location, pickupCoords);
          }
        }, 5000);
      }, []),

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

      "extra-payment-required": useCallback((data) => {
        toast.warning("Extra payment required for this pickup.");
        loadRequests();
        const req = data?.request;
        if (req) {
          setExtraPaymentModal(req);
        }
      }, [loadRequests]),

      "cash-confirmed": useCallback((data) => {
        toast.info("Collector confirmed cash received.");
        loadRequests();
      }, [loadRequests]),

      "subscription-pickup-created": useCallback((data) => {
        toast.info("A scheduled pickup has been created from your subscription.");
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

  useEffect(() => {
    const current = requests.current[0];
    activeRequestRef.current = current;

    if (!current || current.status === "completed" || current.status === "cancelled" || current.status === "expired") {
      setCollectorLocation(null);
      setRouteData(null);
      setShowTracker(false);
      setChatOpen(false);
      nearbyNotifiedRef.current.clear();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [requests]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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

  const activeRequest = requests.current[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Top Bar ─── */}
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
              to={ROUTES.HOME}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaHome className="h-3.5 w-3.5" />
              Home
            </Link>
            <button
              onClick={() => navigate(ROUTES.RESIDENT_MY_REQUESTS)}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Requests
            </button>
            <button
              onClick={() => setShowWallet(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaWallet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Wallet</span>
            </button>
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

        {/* ─── Subscriptions link ─── */}
        <Link
          to={ROUTES.RESIDENT_MY_SUBSCRIPTIONS}
          className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
            <FaCalendarAlt className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Subscriptions</p>
            <p className="text-sm text-gray-400">Automate recurring waste pickups</p>
          </div>
          <FaCalendarAlt className="text-gray-300" />
        </Link>

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

                {activeRequest.status === "weight_verified" && activeRequest.paymentStatus !== "awaiting_extra_payment" && (
                  <button
                    onClick={() => setOtpModal(activeRequest._id)}
                    className="w-full rounded-xl bg-amber-50 border-2 border-amber-200 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100 transition"
                  >
                    <span className="flex items-center justify-center gap-2"><FaKey className="h-4 w-4" /> View OTP</span>
                  </button>
                )}
                {activeRequest.paymentStatus === "awaiting_extra_payment" && (
                  <button
                    onClick={() => setExtraPaymentModal(activeRequest)}
                    className="w-full rounded-xl bg-orange-50 border-2 border-orange-200 py-2.5 text-sm font-bold text-orange-700 hover:bg-orange-100 transition"
                  >
                    <span className="flex items-center justify-center gap-2"><FaMoneyBillWave className="h-4 w-4" /> Pay Extra {formatCurrency(activeRequest.extraPaymentAmount)}</span>
                  </button>
                )}
                {(activeRequest.status === "broadcasting" || activeRequest.status === "accepted") && (
                  <button
                    onClick={() => setCancelModal(activeRequest)}
                    className="w-full rounded-xl border-2 border-red-200 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition"
                  >
                    Cancel Request
                  </button>
                )}
                {activeRequest.status === "accepted" && (
                  <button
                    onClick={() => setShowTracker((prev) => !prev)}
                    className="w-full rounded-xl bg-brand-50 border-2 border-brand-200 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100 transition"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FaMap className="h-4 w-4" />
                      {showTracker ? "Hide Map" : "Track on Map"}
                    </span>
                  </button>
                )}
                {["accepted", "collector_arrived", "weight_verified"].includes(activeRequest.status) && activeRequest.collector && (
                  <button
                    onClick={() => setChatOpen((prev) => !prev)}
                    className="w-full rounded-xl bg-brand-50 border-2 border-brand-200 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-100 transition"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FaComments className="h-4 w-4" />
                      {chatOpen ? "Close Chat" : "Chat with Collector"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {showTracker && activeRequest.status === "accepted" && (
              <div className="mt-3">
                <LiveCollectorTracker
                  pickup={activeRequest}
                  collectorLocation={collectorLocation}
                  routeData={routeData}
                />
              </div>
            )}

            {chatOpen && activeRequest.collector && (
              <div className="mt-3">
                <ChatPanel pickup={activeRequest} socketRef={socketRef} onClose={() => setChatOpen(false)} />
              </div>
            )}
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
      {cancelModal && (
        <CancelConfirmationModal
          request={cancelModal}
          onClose={() => setCancelModal(null)}
          onConfirm={async () => {
            await handleCancel(cancelModal._id);
            setCancelModal(null);
          }}
        />
      )}
      {extraPaymentModal && (
        <ExtraPaymentModal
          request={extraPaymentModal}
          onClose={() => setExtraPaymentModal(null)}
          onSuccess={() => { setExtraPaymentModal(null); loadRequests(); }}
        />
      )}
      {showWallet && <WalletPanel onClose={() => setShowWallet(false)} role="resident" />}
    </div>
  );
};

export default Dashboard;
