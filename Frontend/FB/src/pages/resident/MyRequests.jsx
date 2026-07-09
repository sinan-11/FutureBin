import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRecycle, FaPlus, FaCheckCircle, FaTimesCircle,
  FaHourglass, FaTruck, FaMapMarkerAlt, FaWeight,
  FaMoneyBillWave, FaArrowLeft, FaKey,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { getMyPickupsService, cancelPickupService, getPickupOtpService } from "../../services/pickupService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";
import { ListSkeleton } from "../../components/Skeleton";

const STATUS_BADGES = {
  broadcasting: { label: "Finding Collector", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  accepted: { label: "Accepted", color: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  collector_arrived: { label: "Collector Arrived", color: "bg-purple-50 text-purple-700 ring-purple-200" },
  weight_verified: { label: "Weight Verified", color: "bg-orange-50 text-orange-700 ring-orange-200" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 ring-green-200" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 ring-red-200" },
  expired: { label: "Expired", color: "bg-gray-50 text-gray-600 ring-gray-200" },
};

const StatusDot = ({ status }) => {
  const colors = {
    broadcasting: "bg-blue-500",
    accepted: "bg-indigo-500",
    collector_arrived: "bg-purple-500",
    weight_verified: "bg-orange-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
    expired: "bg-gray-400",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status] || "bg-gray-300"}`} />;
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

const RequestCard = ({ request, onCancel, cancelling }) => {
  const badge = STATUS_BADGES[request.status] || { label: request.status, color: "bg-gray-50 text-gray-600 ring-gray-200" };
  const canCancel = request.status === "broadcasting" || request.status === "accepted";
  const [showOtp, setShowOtp] = useState(false);

  return (
    <div className="group rounded-2xl bg-white border border-gray-100 p-4 shadow-sm transition-all hover:shadow-md hover:border-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusDot status={request.status} />
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.color}`}>
              {badge.label}
            </span>
            {request.status === "weight_verified" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <FaKey className="h-3 w-3" />
                Waiting for OTP
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              <FaRecycle className="h-3 w-3" />
              {capitalize(request.wasteType)}
            </span>
          </div>

          <h4 className="font-semibold text-gray-800 truncate">{request.pickupAddress}</h4>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><FaWeight className="h-3.5 w-3.5 text-gray-400" />Est: {request.estimatedWeight} kg</span>
            {request.actualWeight && (
              <span className="flex items-center gap-1"><FaWeight className="h-3.5 w-3.5 text-brand-500" />Actual: <span className="font-medium text-brand-600">{request.actualWeight} kg</span></span>
            )}
            <span className="flex items-center gap-1"><FaMoneyBillWave className="h-3.5 w-3.5 text-gray-400" />Est: ₹{request.estimatedPrice}</span>
            {request.finalAmount && (
              <span className="flex items-center gap-1"><FaMoneyBillWave className="h-3.5 w-3.5 text-brand-500" />Final: <span className="font-medium text-brand-600">₹{request.finalAmount}</span></span>
            )}
            {request.scheduledAt && (
              <span className="flex items-center gap-1"><FaMapMarkerAlt className="h-3.5 w-3.5" />{formatDateTime(request.scheduledAt)}</span>
            )}
          </div>

          {request.collector && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 p-2 text-sm">
              <FaTruck className="h-4 w-4 text-brand-600" />
              <span className="font-medium text-brand-700">{request.collector.name}</span>
              {request.collector.collectorDetails?.phone && (
                <span className="text-brand-500">· {request.collector.collectorDetails.phone}</span>
              )}
            </div>
          )}

          {request.description && (
            <p className="mt-2 text-sm text-gray-400 italic">{request.description}</p>
          )}

          <div className="mt-2 text-xs text-gray-400">
            Created {formatDateTime(request.createdAt)}
            {request.acceptedAt && <> · Accepted {formatDateTime(request.acceptedAt)}</>}
            {request.arrivedAt && <> · Arrived {formatDateTime(request.arrivedAt)}</>}
            {request.completedAt && <> · Completed {formatDateTime(request.completedAt)}</>}
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          {request.status === "weight_verified" && (
            <button
              onClick={() => setShowOtp(true)}
              className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 border border-amber-200 transition hover:bg-amber-100 active:scale-95"
            >
              <span className="flex items-center gap-1.5"><FaKey className="h-3.5 w-3.5" /> View OTP</span>
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel(request._id)}
              disabled={cancelling}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-red-500 border border-red-200 transition hover:bg-red-50 active:scale-95 disabled:opacity-50"
            >
              {cancelling ? "..." : "Cancel"}
            </button>
          )}
        </div>
      </div>

      {showOtp && <OTPModal requestId={request._id} onClose={() => setShowOtp(false)} />}
    </div>
  );
};

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

const MyRequests = () => {
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState({ current: [], completed: [], cancelled: [] });
  const [cancelling, setCancelling] = useState(null);

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

  useEffect(() => {
    loadRequests();
    pollRef.current = setInterval(loadRequests, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [loadRequests]);

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

  if (loading) return <div className="animate-fade-in"><ListSkeleton count={4} /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <button
        onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        <FaArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Requests</h2>
          <p className="text-sm text-gray-400">Track all your waste pickup requests.</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.RESIDENT_CREATE_REQUEST)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
        >
          <FaPlus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="space-y-8">
        <Section title="Current" count={requests.current.length} icon={FaHourglass}>
          {requests.current.map((req) => (
            <RequestCard key={req._id} request={req} onCancel={handleCancel} cancelling={cancelling === req._id} />
          ))}
        </Section>

        <Section title="Completed" count={requests.completed.length} icon={FaCheckCircle}>
          {requests.completed.map((req) => (
            <RequestCard key={req._id} request={req} onCancel={handleCancel} cancelling={cancelling === req._id} />
          ))}
        </Section>

        <Section title="Cancelled / Expired" count={requests.cancelled.length} icon={FaTimesCircle}>
          {requests.cancelled.map((req) => (
            <RequestCard key={req._id} request={req} onCancel={handleCancel} cancelling={cancelling === req._id} />
          ))}
        </Section>
      </div>
    </div>
  );
};

export default MyRequests;
