import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaMapMarkerAlt, FaTruck, FaCheckCircle,
  FaArrowRight, FaRecycle, FaWeight,
  FaMoneyBillWave, FaUser, FaBroadcastTower, FaHome, FaWallet, FaTimes, FaKey, FaClipboardCheck,
  FaCalendarAlt,
  FaMap,
  FaInfoCircle,
  FaComments,
  FaLeaf, FaSignOutAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import {
  updateAvailabilityService,
  updateLocationService,
  getMeService,
} from "../../services/userService";
import { logoutService } from "../../services/authService";
import {
  getAvailablePickupsService,
  getAssignedPickupsService,
  acceptPickupService,
  rejectPickupService,
  arriveAtPickupService,
  verifyWeightService,
  generateOtpService,
  regenerateOtpService,
  verifyOtpService,
  confirmCashService,
} from "../../services/pickupService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";
import { playNotificationSound } from "../../utils/sound";
import WalletPanel from "../../components/WalletPanel";
import PickupRouteMap from "../../components/map/PickupRouteMap";
import OtpInput from "../../components/OtpInput";
import ChatPanel from "../../components/ChatPanel";

const POLL_INTERVAL = 10000;
const POLL_FALLBACK_DELAY = 5000;

const STATUS_BADGES = {
  accepted: { label: "Accepted", color: "bg-indigo-100 text-indigo-700" },
  collector_arrived: { label: "Arrived", color: "bg-purple-100 text-purple-700" },
  weight_verified: { label: "Weight Verified", color: "bg-orange-100 text-orange-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
};

const Dashboard = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const watchIdRef = useRef(null);
  const locationIntervalRef = useRef(null);

  const [profile, setProfile] = useState(user);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [available, setAvailable] = useState([]);
  const [activePickups, setActivePickups] = useState([]);
  const [completedPickups, setCompletedPickups] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showWallet, setShowWallet] = useState(false);
  const [weightModal, setWeightModal] = useState(null);
  const [otpModal, setOtpModal] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [mapOpen, setMapOpen] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await getMeService();
      setProfile(res.data);
      setIsAvailable(res.data.isAvailable);
    } catch { /* silent */ }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [avail, assigned] = await Promise.all([
        getAvailablePickupsService(),
        getAssignedPickupsService(),
      ]);
      setAvailable(avail || []);
      setActivePickups(assigned?.active || []);
      setCompletedPickups(assigned?.completed || []);
    } catch { /* silent */ }
  }, []);

  const startPolling = useCallback(() => {
    if (!pollRef.current) {
      pollRef.current = setInterval(loadData, POLL_INTERVAL);
    }
  }, [loadData]);

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

  useEffect(() => {
    if (accessToken) {
      loadProfile();
      loadData();
    }
  }, [accessToken, loadProfile, loadData]);

  const { socketRef, isConnected } = useSocket({
    collectorEvents: {
      "new-request": useCallback(
        (data) => {
          if (!isAvailable) return;
          const request = data.request;
          toast.info(
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <FaRecycle className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">New Pickup Available</p>
                <p className="text-sm text-gray-500">{request.pickupAddress}</p>
              </div>
            </div>,
            {
              autoClose: 8000,
              onClick: () => navigate(ROUTES.COLLECTOR_AVAILABLE),
            }
          );
          playNotificationSound();
          loadData();
        },
        [isAvailable, loadData, navigate]
      ),

      "pickup-cancelled": useCallback(
        (data) => {
          toast.info("A resident cancelled a pickup");
          loadData();
        },
        [loadData]
      ),

      "pickup-completed": useCallback(
        (data) => {
          toast.success("Pickup completed!");
          loadData();
        },
        [loadData]
      ),

      "pickup-expired": useCallback(
        (data) => {
          loadData();
        },
        [loadData]
      ),
    },
    onReconnect: useCallback(() => {
      loadData();
      stopPolling();
    }, [loadData, stopPolling]),
  });

  useEffect(() => {
    if (isAvailable) {
      if (isConnected) {
        stopPolling();
      } else {
        pollTimeoutRef.current = setTimeout(() => {
          startPolling();
        }, POLL_FALLBACK_DELAY);
      }
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isAvailable, isConnected, startPolling, stopPolling]);

  useEffect(() => {
    const acceptedPickup = activePickups.find((p) => p.status === "accepted");

    if (!acceptedPickup) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }

    const pickupId = acceptedPickup._id;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationError(null);
        const { latitude, longitude } = pos.coords;

        const socket = socketRef.current;
        if (socket) {
          socket.emit("collector-location-update", {
            pickupId,
            latitude,
            longitude,
          });
        }
      },
      (error) => {
        console.error("[GPS] watchPosition error:", error);
        setLocationError(error.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    locationIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { longitude, latitude } = pos.coords;
            await updateLocationService(longitude, latitude);
          } catch (error) {
            console.error("[GPS] Failed to persist location:", error);
          }
        },
        (error) => {
          console.error("[GPS] getCurrentPosition error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, 30000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
  }, [activePickups, isConnected, socketRef]);

  const handleToggle = async () => {
    const newStatus = !isAvailable;
    try {
      const res = await updateAvailabilityService(newStatus);
      setIsAvailable(res.data.isAvailable);
      setProfile(res.data);
      if (newStatus) {
        toast.success("You're online — requests will appear here");
        loadData();
      } else {
        toast.success("You're offline");
        setAvailable([]);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { longitude, latitude } = pos.coords;
          const res = await updateLocationService(longitude, latitude);
          setProfile(res.data);
          toast.success("Location updated");
        } catch (error) {
          toast.error(getErrorMessage(error));
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        toast.error("Failed to get location");
      }
    );
  };

  const handleReject = async (id) => {
    setRejecting(id);
    try {
      await rejectPickupService(id);
      setAvailable((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setAvailable((prev) => prev.filter((r) => r._id !== id));
    } finally {
      setRejecting(null);
    }
  };

  const handleAccept = async (id) => {
    setAccepting(id);
    try {
      await acceptPickupService(id);
      toast.success("Pickup accepted!");
      loadData();
    } catch (error) {
      const msg = getErrorMessage(error);
      if (msg.includes("already been accepted")) {
        toast.error("Already taken by another collector");
        setAvailable((prev) => prev.filter((r) => r._id !== id));
      } else if (msg.includes("already have an active pickup")) {
        toast.error(msg);
        loadData();
      } else {
        toast.error(msg);
      }
    } finally {
      setAccepting(null);
    }
  };

  const handleArrive = async (id) => {
    setActionLoading(`arrive-${id}`);
    try {
      await arriveAtPickupService(id);
      toast.success("Arrival confirmed");
      setMapOpen(null);
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyWeight = (id) => {
    setWeightModal(id);
    setWeightInput("");
  };

  const submitWeight = async () => {
    const id = weightModal;
    const w = parseFloat(weightInput);
    if (!w || w <= 0) {
      toast.error("Enter a valid weight");
      return;
    }
    setActionLoading(`weight-${id}`);
    setWeightModal(null);
    try {
      await verifyWeightService(id, w);
      toast.success("Weight verified");
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateOtp = async (id) => {
    setActionLoading(`otp-${id}`);
    try {
      await generateOtpService(id);
      toast.success("New OTP generated and sent to resident");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyOtp = (id) => {
    setOtpModal(id);
    setOtpInput("");
  };

  const submitOtp = async () => {
    const id = otpModal;
    if (!otpInput || otpInput.length !== 6) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }
    setActionLoading(`verify-${id}`);
    setOtpModal(null);
    try {
      await verifyOtpService(id, otpInput);
      toast.success("Pickup completed!");
      loadData();
    } catch (error) {
      const msg = getErrorMessage(error);
      if (msg.includes("Maximum OTP attempts")) {
        toast.error("Too many failed attempts. Generate a new OTP.");
      } else {
        toast.error(msg);
      }
      loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCash = async (id) => {
    setActionLoading(`cash-${id}`);
    try {
      await confirmCashService(id);
      toast.success("Cash received confirmed");
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleMap = (id) => {
    setMapOpen((prev) => (prev === id ? null : id));
  };

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out");
    navigate(ROUTES.HOME, { replace: true });
  };

  const p = profile || {};
  const totalAvailable = available.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Top Bar ─── */}
      <header className="bg-brand-700/95 shadow-lg shadow-brand-900/20 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
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
              onClick={() => setShowWallet(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaWallet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Wallet</span>
            </button>
            <button
              onClick={handleLocation}
              disabled={locationLoading}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaMapMarkerAlt className={`h-3.5 w-3.5 ${locationLoading ? "animate-pulse" : ""}`} />
              {p.location?.coordinates
                ? `${p.location.coordinates[1].toFixed(2)}, ${p.location.coordinates[0].toFixed(2)}`
                : "Set location"}
            </button>
            <div className="mx-1 hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2 rounded-full bg-white/10 pl-1 pr-2 py-1">
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors ${
                  isAvailable ? "bg-green-500" : "bg-white/20"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    isAvailable ? "translate-x-[1.375rem]" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${isAvailable ? "text-green-300" : "text-white/50"}`}>
                {isAvailable ? "On" : "Off"}
              </span>
            </div>
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

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* ─── Offline Overlay ─── */}
        {!isAvailable && (
          <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <FaBroadcastTower className="h-7 w-7 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">You're offline</h2>
            <p className="mt-1 text-sm text-gray-400">Toggle online to see available pickup requests.</p>
          </div>
        )}

        {/* ─── Active Pickup Banner ─── */}
        {isAvailable && activePickups.length > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
            <FaInfoCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              You already have an active pickup. Complete it before accepting another request.
            </p>
          </div>
        )}

        {/* ─── Available Orders ─── */}
        {isAvailable && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaBroadcastTower className="text-brand-600" />
                <h2 className="text-lg font-bold text-gray-800">Available Orders</h2>
                {totalAvailable > 0 && (
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {totalAvailable}
                  </span>
                )}
              </div>
              <button onClick={loadData} className="text-xs text-brand-600 font-medium hover:underline">
                Refresh
              </button>
            </div>

            {totalAvailable === 0 ? (
              <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                  <FaBroadcastTower className="h-6 w-6 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-500">No orders available</p>
                <p className="text-sm text-gray-400 mt-1">Waiting for residents to request pickups...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {available.map((req) => (
                  <div
                    key={req._id}
                    className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                            <FaRecycle className="h-3 w-3" />
                            {capitalize(req.wasteType)}
                          </span>
                          <span className="text-xs text-gray-400">{formatDateTime(req.createdAt)}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm leading-snug">{req.pickupAddress}</h4>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><FaWeight />{req.estimatedWeight} kg</span>
                          <span className="flex items-center gap-1"><FaMoneyBillWave />₹{req.estimatedPrice}</span>
                          {req.scheduledAt && (
                            <span className="flex items-center gap-1"><FaCalendarAlt />{formatDateTime(req.scheduledAt)}</span>
                          )}
                        </div>
                        {req.description && (
                          <p className="mt-1.5 text-xs text-gray-400 italic line-clamp-2">{req.description}</p>
                        )}
                        {req.resident && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                            <FaUser />{req.resident.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(req._id)}
                          disabled={accepting === req._id || rejecting === req._id}
                          className={`flex-shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 transition active:scale-95 ${
                            rejecting === req._id
                              ? "bg-gray-200 cursor-not-allowed"
                              : "bg-gray-50 hover:bg-gray-100 hover:text-gray-700"
                          }`}
                        >
                          {rejecting === req._id ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1"><FaTimes className="h-3 w-3" /> Skip</span>
                          )}
                        </button>
                        <button
                          onClick={() => handleAccept(req._id)}
                          disabled={accepting === req._id || rejecting === req._id || activePickups.length > 0}
                          className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition ${
                            accepting === req._id || activePickups.length > 0
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-brand-600 hover:bg-brand-700 active:scale-95"
                          }`}
                        >
                          {accepting === req._id ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Accepting
                            </span>
                          ) : activePickups.length > 0 ? (
                            <span className="flex items-center gap-1.5">Complete Current Pickup First</span>
                          ) : (
                            <span className="flex items-center gap-1.5">Accept <FaArrowRight className="h-3 w-3" /></span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Map Toggle */}
                    {req.location?.coordinates && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => toggleMap(`avail-${req._id}`)}
                          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition"
                        >
                          <FaMap className="h-3 w-3" />
                          {mapOpen === `avail-${req._id}` ? "Hide Map" : "View Map"}
                        </button>
                        {mapOpen === `avail-${req._id}` && (
                          <PickupRouteMap pickup={req} collectorLocation={profile.location} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── Active Pickups ─── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FaTruck className="text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-800">Active Pickups</h2>
            {activePickups.length > 0 && (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {activePickups.length}
              </span>
            )}
          </div>

          {activePickups.length === 0 ? (
            <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
                <FaTruck className="h-6 w-6 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">No active pickups</p>
              <p className="text-sm text-gray-400 mt-1">Accept an order above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePickups.map((req) => {
                const badge = STATUS_BADGES[req.status] || { label: req.status, color: "bg-gray-100 text-gray-600" };

                return (
                  <div key={req._id} className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            <FaRecycle className="h-3 w-3" />
                            {capitalize(req.wasteType)}
                          </span>
                          {req.paymentMethod && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${req.paymentMethod === "wallet" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                              <FaMoneyBillWave className="h-3 w-3" />
                              {capitalize(req.paymentMethod)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm leading-snug">{req.pickupAddress}</h4>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><FaWeight />Est: {req.estimatedWeight} kg</span>
                          {req.actualWeight && (
                            <span className="flex items-center gap-1"><FaWeight className="text-brand-500" />Actual: <span className="font-medium text-brand-600">{req.actualWeight} kg</span></span>
                          )}
                          <span className="flex items-center gap-1"><FaMoneyBillWave />Est: ₹{req.estimatedPrice}</span>
                          {req.finalAmount && (
                            <span className="flex items-center gap-1"><FaMoneyBillWave className="text-brand-500" />Final: <span className="font-medium text-brand-600">₹{req.finalAmount}</span></span>
                          )}
                        </div>
                        {req.resident && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                            <FaUser />{req.resident.name} {req.resident.email && <span>· {req.resident.email}</span>}
                          </div>
                        )}
                        <div className="mt-1.5 text-xs text-gray-300">
                          {req.acceptedAt && <>Accepted {formatDateTime(req.acceptedAt)}</>}
                          {req.arrivedAt && <> · Arrived {formatDateTime(req.arrivedAt)}</>}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {req.status === "accepted" && (
                          <ActionButton
                            onClick={() => handleArrive(req._id)}
                            loading={actionLoading === `arrive-${req._id}`}
                            label="Arrived"
                            icon={<FaTruck />}
                            color="bg-purple-600 hover:bg-purple-700"
                          />
                        )}
                        {req.status === "collector_arrived" && (
                          <ActionButton
                            onClick={() => handleVerifyWeight(req._id)}
                            loading={actionLoading === `weight-${req._id}`}
                            label="Verify Weight"
                            icon={<FaWeight />}
                            color="bg-orange-600 hover:bg-orange-700"
                          />
                        )}
                        {req.status === "weight_verified" && req.paymentMethod === "cash" && !req.cashConfirmed && (
                          <ActionButton
                            onClick={() => handleConfirmCash(req._id)}
                            loading={actionLoading === `cash-${req._id}`}
                            label="Confirm Cash"
                            icon={<FaMoneyBillWave />}
                            color="bg-green-600 hover:bg-green-700"
                          />
                        )}
                        {req.status === "weight_verified" && req.paymentMethod === "cash" && req.cashConfirmed && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><FaCheckCircle /> Cash Confirmed</span>
                        )}
        {req.status === "weight_verified" && (req.paymentMethod === "wallet" || (req.paymentMethod === "cash" && req.cashConfirmed)) && (
          <ActionButton
            onClick={() => handleVerifyOtp(req._id)}
            label="Enter OTP"
            icon={<FaClipboardCheck />}
            color="bg-brand-600 hover:bg-brand-700"
          />
        )}
        {req.status === "weight_verified" && req.paymentStatus === "awaiting_extra_payment" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-orange-600"><FaMoneyBillWave /> Awaiting Extra Payment</span>
        )}
                      </div>
                    </div>

                    {/* Chat + Map Toggle */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
                      {["accepted", "collector_arrived", "weight_verified"].includes(req.status) && (
                        <button
                          onClick={() => setChatOpen(req._id === chatOpen ? null : req._id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition"
                        >
                          <FaComments className="h-3 w-3" />
                          {chatOpen === req._id ? "Close Chat" : "Chat"}
                        </button>
                      )}
                      {req.location?.coordinates && (
                        <button
                          onClick={() => toggleMap(`active-${req._id}`)}
                          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition"
                        >
                          <FaMap className="h-3 w-3" />
                          {mapOpen === `active-${req._id}` ? "Hide Map" : "View Map"}
                        </button>
                      )}
                    </div>
                    {chatOpen === req._id && (
                      <ChatPanel pickup={req} socketRef={socketRef} onClose={() => setChatOpen(null)} />
                    )}
                    {mapOpen === `active-${req._id}` && req.location?.coordinates && (
                      <div className="mt-3">
                        <PickupRouteMap pickup={req} collectorLocation={profile.location} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── Completed Pickups ─── */}
        {completedPickups.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FaCheckCircle className="text-green-500" />
              <h2 className="text-lg font-bold text-gray-800">Completed</h2>
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-xs font-bold text-green-700">
                {completedPickups.length}
              </span>
            </div>
            <div className="space-y-2">
              {completedPickups.map((req) => (
                <div key={req._id} className="rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 text-sm truncate">{req.pickupAddress}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <FaRecycle className="inline mr-1" />
                        {capitalize(req.wasteType)} · {req.actualWeight || req.estimatedWeight} kg · ₹{req.finalAmount || req.estimatedPrice}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ml-3">
                      Done
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Weight Modal */}
      {weightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Verify Actual Weight</h3>
            <p className="text-sm text-gray-400 mb-4">Enter the actual weight of the waste collected.</p>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="e.g. 14.5"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              autoFocus
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setWeightModal(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitWeight}
                className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Enter OTP</h3>
            <p className="text-sm text-gray-400 mb-4">Ask the resident for the 6-digit OTP to complete the pickup.</p>
            <OtpInput value={otpInput} onChange={setOtpInput} />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleGenerateOtp(otpModal)}
                disabled={actionLoading === `otp-${otpModal}`}
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {actionLoading === `otp-${otpModal}` ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  <><FaKey className="h-3.5 w-3.5" /> Regenerate OTP</>
                )}
              </button>
            </div>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => setOtpModal(null)}
                className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitOtp}
                className="flex-1 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
              >
                Verify & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {showWallet && <WalletPanel onClose={() => setShowWallet(false)} />}
    </div>
  );
};

const ActionButton = ({ onClick, loading, label, icon, color }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition active:scale-95 ${
      loading ? "bg-gray-400 cursor-not-allowed" : color
    }`}
  >
    {loading ? (
      <span className="flex items-center gap-1.5">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Processing
      </span>
    ) : (
      <span className="flex items-center gap-1.5">{icon} {label}</span>
    )}
  </button>
);

export default Dashboard;
