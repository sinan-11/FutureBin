import { useEffect, useState, useRef, useCallback } from "react";
import {
  FaBroadcastTower, FaWeight, FaMoneyBillWave,
  FaUser, FaRecycle, FaSyncAlt,
  FaArrowRight, FaTimes,
  FaCalendarAlt, FaInfoCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

import {
  getAvailablePickupsService,
  getAssignedPickupsService,
  acceptPickupService,
  rejectPickupService,
} from "../../services/pickupService";
import useSocket from "../../hooks/useSocket";
import useAuth from "../../hooks/useAuth";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";
import { playNotificationSound } from "../../utils/sound";
import CollectorLayout from "../../layouts/CollectorLayout";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import Button from "../../components/Button";
import { ListSkeleton } from "../../components/Skeleton";

const POLL_INTERVAL = 10000;

const WASTE_COLORS = {
  recyclable: { bg: "bg-success-50 dark:bg-success-500/10", text: "text-success-700 dark:text-success-300", ring: "ring-success-200 dark:ring-success-500/20", dot: "bg-success-500" },
  organic: { bg: "bg-warning-50 dark:bg-warning-500/10", text: "text-warning-700 dark:text-warning-300", ring: "ring-warning-200 dark:ring-warning-500/20", dot: "bg-warning-500" },
  hazardous: { bg: "bg-danger-50 dark:bg-danger-500/10", text: "text-danger-700 dark:text-danger-300", ring: "ring-danger-200 dark:ring-danger-500/20", dot: "bg-danger-500" },
  electronic: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-300", ring: "ring-purple-200 dark:ring-purple-500/20", dot: "bg-purple-500" },
  general: { bg: "bg-info-50 dark:bg-info-500/10", text: "text-info-700 dark:text-info-300", ring: "ring-info-200 dark:ring-info-500/20", dot: "bg-info-500" },
};

const RequestCard = ({ req, onAccept, onReject, accepting, rejecting, hasActivePickup }) => {
  const wasteStyle = WASTE_COLORS[req.wasteType] || WASTE_COLORS.general;
  const loading = accepting === req._id || rejecting === req._id;
  const acceptDisabled = loading || hasActivePickup;

  return (
    <div className="card card-hover p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${wasteStyle.bg} ${wasteStyle.text} ${wasteStyle.ring}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${wasteStyle.dot}`} />
          {capitalize(req.wasteType)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
          <FaBroadcastTower className="h-3 w-3" />
          Available
        </span>
        {req.estimatedWeight >= 10 && (
          <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20">
            Bulk
          </span>
        )}
      </div>

      <h3 className="mb-3 font-semibold leading-snug text-surface-800 dark:text-surface-800">
        {req.pickupAddress}
      </h3>

      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-surface-500 dark:text-surface-400">
        <span className="flex items-center gap-1.5">
          <FaWeight className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
          <span className="font-medium text-surface-600 dark:text-surface-500">{req.estimatedWeight}</span> kg
        </span>
        <span className="flex items-center gap-1.5">
          <FaMoneyBillWave className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
          <span className="font-medium text-surface-600 dark:text-surface-500">₹{req.estimatedPrice}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <FaCalendarAlt className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
          {req.scheduledAt ? formatDateTime(req.scheduledAt) : "ASAP"}
        </span>
      </div>

      {req.description && (
        <p className="mb-3 line-clamp-2 text-sm italic text-surface-400 dark:text-surface-500">{req.description}</p>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-surface-100 pt-3 dark:border-surface-200/60">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <FaUser className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 truncate">
            <p className="truncate text-sm font-medium text-surface-700 dark:text-surface-300">
              {req.resident?.name || "Resident"}
            </p>
            {req.resident?.email && (
              <p className="truncate text-xs text-surface-400 dark:text-surface-500">{req.resident.email}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReject(req._id)}
            disabled={loading}
            loading={rejecting === req._id}
          >
            {rejecting === req._id ? "Removing" : <span className="flex items-center gap-1.5"><FaTimes className="h-3 w-3" /> Skip</span>}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAccept(req._id)}
            disabled={acceptDisabled}
            loading={accepting === req._id}
          >
            {accepting === req._id ? "Accepting" : hasActivePickup ? (
              <span className="flex items-center gap-1.5">Complete Current Pickup First</span>
            ) : (
              <span className="flex items-center gap-1.5">Accept <FaArrowRight className="h-3.5 w-3.5" /></span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AvailableRequests = () => {
  const pollRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [hasActivePickup, setHasActivePickup] = useState(false);

  const { user } = useAuth();

  const loadAvailable = async () => {
    try {
      const [data, assigned] = await Promise.all([
        getAvailablePickupsService(),
        getAssignedPickupsService(),
      ]);
      setRequests(data || []);
      setHasActivePickup((assigned?.active || []).length > 0);
    } catch {
      toast.error("Failed to load available requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailable();
    pollRef.current = setInterval(loadAvailable, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  useSocket({
    collectorEvents: {
      "new-request": useCallback((data) => {
        const request = data.request;
        toast.info(
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <FaRecycle className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-surface-800 dark:text-surface-800">New Pickup Available</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">{request.pickupAddress}</p>
            </div>
          </div>,
          { autoClose: 8000 }
        );
        playNotificationSound();
        setRequests((prev) => {
          if (prev.some((r) => r._id === request._id)) return prev;
          return [request, ...prev];
        });
      }, []),

      "pickup-cancelled": useCallback((data) => {
        const request = data.request;
        toast.info("A pickup request was cancelled");
        setRequests((prev) => prev.filter((r) => r._id !== request._id));
      }, []),
    },
  });

  const handleReject = async (id) => {
    setRejecting(id);
    try {
      await rejectPickupService(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch {
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } finally {
      setRejecting(null);
    }
  };

  const handleAccept = async (id) => {
    setAccepting(id);
    try {
      await acceptPickupService(id);
      toast.success("Pickup accepted!");
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      const msg = getErrorMessage(error);
      if (msg.includes("already been accepted")) {
        toast.error("Already taken by another collector");
        setRequests((prev) => prev.filter((r) => r._id !== id));
      } else if (msg.includes("already have an active pickup")) {
        toast.error(msg);
        setHasActivePickup(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setAccepting(null);
    }
  };

  return (
    <CollectorLayout userName={user?.name}>
      <div className="mx-auto max-w-2xl animate-fade-in pb-8">
        <PageHeader
          title="Available Pickups"
          subtitle={
            requests.length > 0
              ? `${requests.length} request${requests.length > 1 ? "s" : ""} waiting for a collector`
              : "No available requests right now"
          }
          icon={FaBroadcastTower}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={loadAvailable}
              disabled={loading}
              icon={FaSyncAlt}
            >
              {loading ? "Refreshing" : "Refresh"}
            </Button>
          }
        />

        {hasActivePickup && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warning-200 bg-warning-50 px-5 py-4 dark:border-warning-500/20 dark:bg-warning-500/10">
            <FaInfoCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-500" />
            <p className="text-sm font-medium text-warning-700 dark:text-warning-300">
              You already have an active pickup. Complete it before accepting another request.
            </p>
          </div>
        )}

        {loading ? (
          <ListSkeleton count={4} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FaBroadcastTower}
            title="All caught up"
            description="Waiting for residents to request pickups..."
          />
        ) : (
          <div className="space-y-4">
            {requests.map((req, idx) => (
              <div
                key={req._id}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <RequestCard
                  req={req}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  accepting={accepting}
                  rejecting={rejecting}
                  hasActivePickup={hasActivePickup}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </CollectorLayout>
  );
};

export default AvailableRequests;
