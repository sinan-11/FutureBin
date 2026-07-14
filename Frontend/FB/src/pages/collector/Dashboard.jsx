import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt, FaTruck, FaCheckCircle,
  FaArrowRight, FaRecycle, FaWeight,
  FaMoneyBillWave, FaUser, FaBroadcastTower, FaHome, FaWallet, FaTimes, FaKey, FaClipboardCheck,
  FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import {
  updateAvailabilityService,
  updateLocationService,
  getMeService,
} from "../../services/userService";
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
} from "../../services/pickupService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";
import { playNotificationSound } from "../../utils/sound";
import WalletPanel from "../../components/WalletPanel";
import OtpInput from "../../components/OtpInput";

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

  const { isConnected } = useSocket({
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

  const p = profile || {};
  const totalAvailable = available.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Top Bar ─── */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-sm">
              {p.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "C"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm leading-tight truncate">{p.name || "Collector"}</p>
              <p className="text-xs text-gray-400 capitalize truncate">{p.collectorDetails?.vehicleNumber || "Collector"}</p>
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
              className="hidden xs:flex sm:flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
            >
              <FaWallet className="h-3 w-3" />
              <span className="hidden sm:inline">Wallet</span>
            </button>
            <button
              onClick={handleLocation}
              disabled={locationLoading}
              className="hidden sm:flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
            >
              <FaMapMarkerAlt className={locationLoading ? "animate-pulse" : ""} />
              {p.location?.coordinates
                ? `${p.location.coordinates[1].toFixed(2)}, ${p.location.coordinates[0].toFixed(2)}`
                : "Set location"}
            </button>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-7 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                isAvailable ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  isAvailable ? "translate-x-[1.375rem]" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex-shrink-0 ${isAvailable ? "text-green-600" : "text-gray-400"}`}>
              {isAvailable ? "On" : "Off"}
            </span>
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
                          disabled={accepting === req._id || rejecting === req._id}
                          className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition ${
                            accepting === req._id
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
                          ) : (
                            <span className="flex items-center gap-1.5">Accept <FaArrowRight className="h-3 w-3" /></span>
                          )}
                        </button>
                      </div>
                    </div>
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
        {req.status === "weight_verified" && (
          <ActionButton
            onClick={() => handleVerifyOtp(req._id)}
            label="Enter OTP"
            icon={<FaClipboardCheck />}
            color="bg-brand-600 hover:bg-brand-700"
          />
        )}
                      </div>
                    </div>
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
