import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTruck, FaCheckCircle, FaHourglass, FaWeight,
  FaMoneyBillWave, FaUser, FaArrowRight,
  FaArrowLeft, FaRecycle, FaKey, FaClipboardCheck,
  FaMap,
} from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import {
  getAssignedPickupsService,
  arriveAtPickupService,
  verifyWeightService,
  generateOtpService,
  regenerateOtpService,
  verifyOtpService,
  confirmCashService,
} from "../../services/pickupService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";
import { ListSkeleton } from "../../components/Skeleton";
import OtpInput from "../../components/OtpInput";
import PickupRouteMap from "../../components/map/PickupRouteMap";

const STATUS_BADGES = {
  accepted: { label: "Accepted", color: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  collector_arrived: { label: "Arrived", color: "bg-purple-50 text-purple-700 ring-purple-200" },
  weight_verified: { label: "Weight Verified", color: "bg-orange-50 text-orange-700 ring-orange-200" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 ring-green-200" },
};

const STATUS_STEPS = [
  "accepted",
  "collector_arrived",
  "weight_verified",
  "completed",
];

const ProgressDots = ({ currentStatus }) => {
  const currentIdx = STATUS_STEPS.indexOf(currentStatus);
  if (currentIdx < 0 || currentStatus === "completed") return null;

  return (
    <div className="flex items-center gap-1.5 mb-3">
      {STATUS_STEPS.slice(0, -1).map((step, i) => (
        <div key={step} className="flex items-center">
          <span
            className={`flex h-2.5 w-2.5 rounded-full transition-all ${
              i <= currentIdx ? "bg-brand-500 scale-110" : "bg-gray-200"
            }`}
          />
          {i < STATUS_STEPS.length - 2 && (
            <span
              className={`block h-0.5 w-4 transition-all ${
                i < currentIdx ? "bg-brand-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const PickupCard = ({
  request,
  onArrive,
  onVerifyWeight,
  onVerifyOtp,
  onConfirmCash,
  onGenerateOtp,
  loading,
  mapOpen,
  onToggleMap,
  collectorLocation,
}) => {
  const badge = STATUS_BADGES[request.status] || { label: request.status, color: "bg-gray-50 text-gray-600 ring-gray-200" };
  const isFinal = request.status === "completed";

  return (
    <div className="group rounded-2xl bg-white border border-gray-100 p-4 shadow-sm transition-all hover:shadow-md hover:border-gray-200">
      {!isFinal && <ProgressDots currentStatus={request.status} />}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.color}`}>
              {badge.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              <FaRecycle className="h-3 w-3" />
              {capitalize(request.wasteType)}
            </span>
            {request.paymentMethod && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${request.paymentMethod === "wallet" ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
                <FaMoneyBillWave className="h-3 w-3" />
                {capitalize(request.paymentMethod)}
              </span>
            )}
          </div>

          <h4 className="font-semibold text-gray-800 truncate">{request.pickupAddress}</h4>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <FaWeight className="h-3.5 w-3.5 text-gray-400" />
              Est: {request.estimatedWeight} kg
            </span>
            {request.actualWeight && (
              <span className="flex items-center gap-1">
                <FaWeight className="h-3.5 w-3.5 text-brand-500" />
                Actual: <span className="font-medium text-brand-600">{request.actualWeight} kg</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <FaMoneyBillWave className="h-3.5 w-3.5 text-gray-400" />
              Est: ₹{request.estimatedPrice}
            </span>
            {request.finalAmount && (
              <span className="flex items-center gap-1">
                <FaMoneyBillWave className="h-3.5 w-3.5 text-brand-500" />
                Final: <span className="font-medium text-brand-600">₹{request.finalAmount}</span>
              </span>
            )}
          </div>

          {request.resident && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-sm">
              <FaUser className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-medium text-gray-700">{request.resident.name}</span>
              {request.resident.email && <span className="text-gray-400">· {request.resident.email}</span>}
            </div>
          )}

          {request.description && (
            <p className="mt-2 text-sm text-gray-400 italic">{request.description}</p>
          )}

          <div className="mt-2 text-xs text-gray-400">
            {request.acceptedAt && <>Accepted {formatDateTime(request.acceptedAt)}</>}
            {request.arrivedAt && <> · Arrived {formatDateTime(request.arrivedAt)}</>}
            {request.completedAt && <> · Completed {formatDateTime(request.completedAt)}</>}
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          {request.status === "accepted" && (
            <ActionButton
              onClick={() => onArrive(request._id)}
              loading={loading === `arrive-${request._id}`}
              label="Arrived"
              icon={<FaTruck className="h-3.5 w-3.5" />}
              color="bg-purple-600 hover:bg-purple-700"
            />
          )}
          {request.status === "collector_arrived" && (
            <ActionButton
              onClick={() => onVerifyWeight(request._id)}
              loading={loading === `weight-${request._id}`}
              label="Verify Weight"
              icon={<FaWeight className="h-3.5 w-3.5" />}
              color="bg-orange-600 hover:bg-orange-700"
            />
          )}
          {request.status === "weight_verified" && request.paymentMethod === "cash" && !request.cashConfirmed && (
            <ActionButton
              onClick={() => onConfirmCash(request._id)}
              loading={loading === `cash-${request._id}`}
              label="Confirm Cash"
              icon={<FaMoneyBillWave className="h-3.5 w-3.5" />}
              color="bg-green-600 hover:bg-green-700"
            />
          )}
          {request.status === "weight_verified" && request.paymentMethod === "cash" && request.cashConfirmed && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700"><FaCheckCircle className="h-3.5 w-3.5" /> Cash Confirmed</span>
          )}
          {request.status === "weight_verified" && request.paymentStatus === "awaiting_extra_payment" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700"><FaMoneyBillWave className="h-3.5 w-3.5" /> Awaiting Payment</span>
          )}
          {request.status === "weight_verified" && (request.paymentMethod === "wallet" || (request.paymentMethod === "cash" && request.cashConfirmed)) && request.paymentStatus !== "awaiting_extra_payment" && (
            <ActionButton
              onClick={() => onVerifyOtp(request._id)}
              label="Enter OTP"
              icon={<FaClipboardCheck className="h-3.5 w-3.5" />}
              color="bg-brand-600 hover:bg-brand-700"
            />
          )}
          {isFinal && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700">
              <FaCheckCircle className="h-3.5 w-3.5" /> Done
            </span>
          )}
        </div>
      </div>

      {/* Map Toggle */}
      {!isFinal && request.location?.coordinates && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => onToggleMap(request._id)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition"
          >
            <FaMap className="h-3 w-3" />
            {mapOpen === request._id ? "Hide Map" : "View Map"}
          </button>
          {mapOpen === request._id && (
            <PickupRouteMap pickup={request} collectorLocation={collectorLocation} />
          )}
        </div>
      )}
    </div>
  );
};

const ActionButton = ({ onClick, loading, label, icon, color }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-95 ${
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

const Section = ({ title, count, icon: Icon, children }) => (
  <div>
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-gray-400" />
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      {count > 0 && (
        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-gray-100 px-2 text-xs font-bold text-gray-600">
          {count}
        </span>
      )}
    </div>
    {count > 0 ? (
      <div className="space-y-3">{children}</div>
    ) : (
      <p className="py-6 text-center text-sm text-gray-400">No {title.toLowerCase()}.</p>
    )}
  </div>
);

const POLL_INTERVAL = 10000;
const POLL_FALLBACK_DELAY = 5000;

const MyPickups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState({ active: [], completed: [] });
  const [actionLoading, setActionLoading] = useState(null);
  const [weightModal, setWeightModal] = useState(null);
  const [otpModal, setOtpModal] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [mapOpen, setMapOpen] = useState(null);

  const loadPickups = useCallback(async () => {
    try {
      const data = await getAssignedPickupsService();
      setPickups(data);
    } catch {
      toast.error("Failed to load pickups");
    } finally {
      setLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!pollRef.current) {
      pollRef.current = setInterval(loadPickups, POLL_INTERVAL);
    }
  }, [loadPickups]);

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
    collectorEvents: {
      "pickup-cancelled": useCallback((data) => {
        toast.info("A resident cancelled a pickup");
        loadPickups();
      }, [loadPickups]),

      "pickup-completed": useCallback((data) => {
        toast.success("Pickup completed!");
        loadPickups();
      }, [loadPickups]),

      "pickup-assigned": useCallback((data) => {
        toast.success("You have a new assigned pickup!");
        loadPickups();
      }, [loadPickups]),

      "arrival-confirmed": useCallback((data) => {
        loadPickups();
      }, [loadPickups]),

      "weight-saved": useCallback((data) => {
        loadPickups();
      }, [loadPickups]),

      "pickup-expired": useCallback((data) => {
        loadPickups();
      }, [loadPickups]),
    },
    onReconnect: useCallback(() => {
      loadPickups();
      stopPolling();
    }, [loadPickups, stopPolling]),
  });

  useEffect(() => {
    loadPickups();
  }, [loadPickups]);

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

  const handleArrive = async (id) => {
    setActionLoading(`arrive-${id}`);
    try {
      await arriveAtPickupService(id);
      toast.success("Marked as arrived");
      loadPickups();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyWeight = async (id) => {
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
      loadPickups();
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
      loadPickups();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerateOtp = async (id) => {
    setActionLoading(`otp-${id}`);
    try {
      await regenerateOtpService(id);
      toast.success("New OTP generated and sent to resident");
      loadPickups();
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
      loadPickups();
    } catch (error) {
      const msg = getErrorMessage(error);
      if (msg.includes("Maximum OTP attempts")) {
        toast.error("Too many failed attempts. Generate a new OTP.");
      } else {
        toast.error(msg);
      }
      loadPickups();
    } finally {
      setActionLoading(null);
    }
  };

  const toggleMap = (id) => {
    setMapOpen((prev) => (prev === id ? null : id));
  };

  const handleConfirmCash = async (id) => {
    setActionLoading(`cash-${id}`);
    try {
      await confirmCashService(id);
      toast.success("Cash received confirmed");
      loadPickups();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="animate-fade-in"><ListSkeleton count={3} /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <button
        onClick={() => navigate(ROUTES.COLLECTOR_DASHBOARD)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        <FaArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Pickups</h2>
        <p className="text-sm text-gray-400">Manage your assigned waste collections.</p>
      </div>

      <div className="space-y-8">
        <Section title="Active" count={pickups.active.length} icon={FaHourglass}>
          {pickups.active.map((req) => (
            <PickupCard
              key={req._id}
              request={req}
              onArrive={handleArrive}
              onVerifyWeight={handleVerifyWeight}
              onVerifyOtp={handleVerifyOtp}
              onConfirmCash={handleConfirmCash}
              onGenerateOtp={handleGenerateOtp}
              loading={actionLoading}
              mapOpen={mapOpen}
              onToggleMap={toggleMap}
              collectorLocation={user?.location}
            />
          ))}
        </Section>

        <Section title="Completed" count={pickups.completed.length} icon={FaCheckCircle}>
          {pickups.completed.map((req) => (
            <PickupCard
              key={req._id}
              request={req}
              onArrive={handleArrive}
              onVerifyWeight={handleVerifyWeight}
              onVerifyOtp={handleVerifyOtp}
              onConfirmCash={handleConfirmCash}
              onGenerateOtp={handleGenerateOtp}
              loading={actionLoading}
              mapOpen={mapOpen}
              onToggleMap={toggleMap}
              collectorLocation={user?.location}
            />
          ))}
        </Section>
      </div>

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
                onClick={() => handleRegenerateOtp(otpModal)}
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
    </div>
  );
};

export default MyPickups;
