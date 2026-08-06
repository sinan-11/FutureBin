import { useEffect, useState, useCallback, useRef } from "react";
import {
  FaTruck, FaCheckCircle, FaHourglass, FaWeight,
  FaMoneyBillWave, FaUser,
  FaRecycle, FaKey, FaClipboardCheck,
  FaMap, FaBoxOpen,
} from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import useSocket from "../../hooks/useSocket";
import CollectorLayout from "../../layouts/CollectorLayout";
import {
  getAssignedPickupsService,
  arriveAtPickupService,
  verifyWeightService,
  generateOtpService,
  regenerateOtpService,
  verifyOtpService,
  confirmCashService,
} from "../../services/pickupService";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";
import { ListSkeleton } from "../../components/Skeleton";
import OtpInput from "../../components/OtpInput";
import PickupRouteMap from "../../components/map/PickupRouteMap";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Input from "../../components/Input";
import ReviewButton from "../../components/ReviewButton";
import ReviewModal from "../../components/ReviewModal";
import { getPickupReviewsService, createReviewService } from "../../services/reviewService";

const STATUS_BADGES = {
  accepted: { label: "Accepted", color: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20" },
  collector_arrived: { label: "Arrived", color: "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/20" },
  weight_verified: { label: "Weight Verified", color: "bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-500/10 dark:text-warning-300 dark:ring-warning-500/20" },
  completed: { label: "Completed", color: "bg-success-50 text-success-700 ring-success-200 dark:bg-success-500/10 dark:text-success-300 dark:ring-success-500/20" },
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
              i <= currentIdx ? "bg-emerald-500 scale-110" : "bg-surface-200 dark:bg-surface-200/70"
            }`}
          />
          {i < STATUS_STEPS.length - 2 && (
            <span
              className={`block h-0.5 w-4 transition-all ${
                i < currentIdx ? "bg-emerald-400" : "bg-surface-200 dark:bg-surface-200/70"
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
  loading,
  mapOpen,
  onToggleMap,
  collectorLocation,
  hasReviewed,
  onReview,
}) => {
  const badge = STATUS_BADGES[request.status] || { label: request.status, color: "bg-surface-100 text-surface-600 ring-surface-200 dark:bg-surface-200/60 dark:text-surface-500 dark:ring-surface-200" };
  const isFinal = request.status === "completed";

  return (
    <div className="card card-hover p-4">
      {!isFinal && <ProgressDots currentStatus={request.status} />}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.color}`}>
              {badge.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-600 dark:bg-surface-200/60 dark:text-surface-500">
              <FaRecycle className="h-3 w-3" />
              {capitalize(request.wasteType)}
            </span>
            {request.paymentMethod && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${request.paymentMethod === "wallet" ? "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20" : "bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-500/10 dark:text-warning-300 dark:ring-warning-500/20"}`}>
                <FaMoneyBillWave className="h-3 w-3" />
                {capitalize(request.paymentMethod)}
              </span>
            )}
          </div>

          <h4 className="font-semibold text-surface-800 truncate">{request.pickupAddress}</h4>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <FaWeight className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
              Est: {request.estimatedWeight} kg
            </span>
            {request.actualWeight && (
              <span className="flex items-center gap-1">
                <FaWeight className="h-3.5 w-3.5 text-emerald-500" />
                Actual: <span className="font-medium text-emerald-600 dark:text-emerald-400">{request.actualWeight} kg</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <FaMoneyBillWave className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
              Est: ₹{request.estimatedPrice}
            </span>
            {request.finalPrice && (
              <span className="flex items-center gap-1">
                <FaMoneyBillWave className="h-3.5 w-3.5 text-emerald-500" />
                Final: <span className="font-medium text-emerald-600 dark:text-emerald-400">₹{request.finalPrice}</span>
              </span>
            )}
          </div>

          {request.resident && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-100/60 p-2 text-sm dark:bg-surface-200/40">
              <FaUser className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
              <span className="font-medium text-surface-700 dark:text-surface-300">{request.resident.name}</span>
              {request.resident.email && <span className="text-surface-400 dark:text-surface-500">· {request.resident.email}</span>}
            </div>
          )}

          {request.description && (
            <p className="mt-2 text-sm italic text-surface-400 dark:text-surface-500">{request.description}</p>
          )}

          <div className="mt-2 text-xs text-surface-400 dark:text-surface-500">
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
              className="!bg-purple-600 hover:!bg-purple-500 active:!bg-purple-700 focus-visible:!ring-purple-500/50"
            />
          )}
          {request.status === "collector_arrived" && (
            <ActionButton
              onClick={() => onVerifyWeight(request._id)}
              loading={loading === `weight-${request._id}`}
              label="Verify Weight"
              icon={<FaWeight className="h-3.5 w-3.5" />}
              className="!bg-warning-600 hover:!bg-warning-500 active:!bg-warning-700 focus-visible:!ring-warning-500/50"
            />
          )}
          {request.status === "weight_verified" && request.paymentMethod === "cash" && !request.cashConfirmed && (
            <ActionButton
              onClick={() => onConfirmCash(request._id)}
              loading={loading === `cash-${request._id}`}
              label="Confirm Cash"
              icon={<FaMoneyBillWave className="h-3.5 w-3.5" />}
              className="!bg-success-600 hover:!bg-success-500 active:!bg-success-700 focus-visible:!ring-success-500/50"
            />
          )}
          {request.status === "weight_verified" && request.paymentMethod === "cash" && request.cashConfirmed && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-success-50 px-4 py-2.5 text-sm font-bold text-success-700 dark:bg-success-500/10 dark:text-success-300"><FaCheckCircle className="h-3.5 w-3.5" /> Cash Confirmed</span>
          )}
          {request.status === "weight_verified" && request.paymentStatus === "awaiting_extra_payment" && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-warning-50 px-4 py-2.5 text-sm font-bold text-warning-700 dark:bg-warning-500/10 dark:text-warning-300"><FaMoneyBillWave className="h-3.5 w-3.5" /> Awaiting Payment</span>
          )}
          {request.status === "weight_verified" && (request.paymentMethod === "wallet" || (request.paymentMethod === "cash" && request.cashConfirmed)) && request.paymentStatus !== "awaiting_extra_payment" && (
            <ActionButton
              onClick={() => onVerifyOtp(request._id)}
              label="Enter OTP"
              icon={<FaClipboardCheck className="h-3.5 w-3.5" />}
            />
          )}
          {isFinal && (
            <ReviewButton
              hasReviewed={hasReviewed}
              onClick={() => onReview(request)}
              loading={loading === `review-${request._id}`}
            />
          )}
        </div>
      </div>

      {/* Map Toggle */}
      {!isFinal && request.location?.coordinates && (
        <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-200/60">
          <button
            onClick={() => onToggleMap(request._id)}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition dark:text-emerald-400 dark:hover:text-emerald-300"
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

const ActionButton = ({ onClick, loading, label, icon, className = "" }) => (
  <Button
    variant="primary"
    size="md"
    onClick={onClick}
    disabled={loading}
    loading={loading}
    className={`shrink-0 ${className}`}
  >
    {loading ? "Processing" : <span className="flex items-center gap-1.5">{icon} {label}</span>}
  </Button>
);

const Section = ({ title, count, icon: Icon, children }) => (
  <div>
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-surface-400 dark:text-surface-500" />
      <h3 className="text-lg font-bold text-surface-800 dark:text-surface-800">{title}</h3>
      {count > 0 && (
        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-surface-100 px-2 text-xs font-bold text-surface-600 dark:bg-surface-200/60 dark:text-surface-500">
          {count}
        </span>
      )}
    </div>
    {count > 0 ? (
      <div className="space-y-3">{children}</div>
    ) : (
      <p className="py-6 text-center text-sm text-surface-400 dark:text-surface-500">No {title.toLowerCase()}.</p>
    )}
  </div>
);

const POLL_INTERVAL = 10000;
const POLL_FALLBACK_DELAY = 5000;

const MyPickups = () => {
  const { user } = useAuth();
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
  const [reviewedPickups, setReviewedPickups] = useState({});
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadPickups = useCallback(async () => {
    try {
      const data = await getAssignedPickupsService();
      setPickups(data);

      if (data.completed && data.completed.length > 0) {
        const reviewStatus = {};
        await Promise.allSettled(
          data.completed.map(async (pickup) => {
            try {
              const reviews = await getPickupReviewsService(pickup._id);
              reviewStatus[pickup._id] = !!reviews.collectorReview;
            } catch {
              reviewStatus[pickup._id] = false;
            }
          })
        );
        setReviewedPickups(reviewStatus);
      }
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
      "pickup-cancelled": useCallback(() => {
        toast.info("A resident cancelled a pickup");
        loadPickups();
      }, [loadPickups]),

      "pickup-completed": useCallback(() => {
        toast.success("Pickup completed!");
        loadPickups();
      }, [loadPickups]),

      "pickup-assigned": useCallback(() => {
        toast.success("You have a new assigned pickup!");
        loadPickups();
      }, [loadPickups]),

      "arrival-confirmed": useCallback(() => {
        loadPickups();
      }, [loadPickups]),

      "weight-saved": useCallback(() => {
        loadPickups();
      }, [loadPickups]),

      "pickup-expired": useCallback(() => {
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

  const handleOpenReview = (request) => {
    setReviewModal(request);
  };

  const handleSubmitReview = async ({ rating, comment, tags }) => {
    if (!reviewModal) return;
    setReviewLoading(true);
    try {
      await createReviewService({
        pickup: reviewModal._id,
        rating,
        comment,
        tags,
      });
      toast.success("Review submitted successfully!");
      setReviewedPickups((prev) => ({ ...prev, [reviewModal._id]: true }));
      setReviewModal(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading)
    return (
      <CollectorLayout userName={user?.name}>
        <div className="animate-fade-in"><ListSkeleton count={3} /></div>
      </CollectorLayout>
    );

  return (
    <CollectorLayout userName={user?.name}>
      <div className="mx-auto max-w-2xl animate-fade-in pb-8">
        <PageHeader
          title="My Pickups"
          subtitle="Manage your assigned waste collections."
          icon={FaBoxOpen}
        />

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
                hasReviewed={!!reviewedPickups[req._id]}
                onReview={handleOpenReview}
              />
            ))}
          </Section>
        </div>

        {/* Weight Modal */}
        {weightModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-popover animate-fade-in dark:bg-surface-100">
              <h3 className="text-lg font-bold text-surface-800 mb-1">Verify Actual Weight</h3>
              <p className="text-sm text-surface-400 mb-4 dark:text-surface-500">Enter the actual weight of the waste collected.</p>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="e.g. 14.5"
                autoFocus
                className="mb-0"
              />
              <div className="mt-4 flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setWeightModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={submitWeight}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Modal */}
        {otpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-popover animate-fade-in dark:bg-surface-100">
              <h3 className="text-lg font-bold text-surface-800 mb-1">Enter OTP</h3>
              <p className="text-sm text-surface-400 mb-4 dark:text-surface-500">Ask the resident for the 6-digit OTP to complete the pickup.</p>
              <OtpInput value={otpInput} onChange={setOtpInput} />
              <div className="mt-4">
                <Button
                  variant="primary"
                  fullWidth
                  loading={actionLoading === `otp-${otpModal}`}
                  disabled={actionLoading === `otp-${otpModal}`}
                  onClick={() => handleRegenerateOtp(otpModal)}
                  className="!bg-warning-600 hover:!bg-warning-500 active:!bg-warning-700 focus-visible:!ring-warning-500/50"
                >
                  {actionLoading === `otp-${otpModal}` ? "Generating..." : (
                    <span className="flex items-center gap-1.5"><FaKey className="h-3.5 w-3.5" /> Regenerate OTP</span>
                  )}
                </Button>
              </div>
              <div className="mt-3 flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setOtpModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={submitOtp}
                >
                  Verify & Complete
                </Button>
              </div>
            </div>
          </div>
        )}

        {reviewModal && (
          <ReviewModal
            isOpen={!!reviewModal}
            onClose={() => setReviewModal(null)}
            revieweeName={reviewModal.resident?.name || "Resident"}
            reviewerRole="collector"
            pickupAddress={reviewModal.pickupAddress}
            onSubmit={handleSubmitReview}
            loading={reviewLoading}
          />
        )}
      </div>
    </CollectorLayout>
  );
};

export default MyPickups;
