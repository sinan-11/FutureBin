import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBroadcastTower, FaWeight, FaMoneyBillWave,
  FaUser, FaRecycle, FaArrowLeft,
  FaArrowRight, FaMapMarkerAlt, FaTimes,
  FaCalendarAlt, FaClock,
} from "react-icons/fa";
import { toast } from "react-toastify";

import {
  getAvailablePickupsService,
  acceptPickupService,
  rejectPickupService,
} from "../../services/pickupService";
import useSocket from "../../hooks/useSocket";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";
import { playNotificationSound } from "../../utils/sound";
import { ListSkeleton } from "../../components/Skeleton";

const POLL_INTERVAL = 10000;

const WASTE_COLORS = {
  recyclable: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200", dot: "bg-green-500" },
  organic: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", dot: "bg-amber-500" },
  hazardous: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "bg-red-500" },
  electronic: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200", dot: "bg-purple-500" },
  general: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", dot: "bg-blue-500" },
};

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const RequestCard = ({ req, onAccept, onReject, accepting, rejecting }) => {
  const wasteStyle = WASTE_COLORS[req.wasteType] || WASTE_COLORS.general;
  const loading = accepting === req._id || rejecting === req._id;

  return (
    <div className="group rounded-2xl bg-white border border-gray-100 p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${wasteStyle.bg} ${wasteStyle.text} ${wasteStyle.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${wasteStyle.dot}`} />
            {capitalize(req.wasteType)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
            <FaBroadcastTower className="h-3 w-3" />
            Available
          </span>
          {req.estimatedWeight >= 10 && (
            <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
              Bulk
            </span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-gray-800 leading-snug mb-3">
        {req.pickupAddress}
      </h3>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500 mb-3">
        <span className="flex items-center gap-1.5">
          <FaWeight className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-medium text-gray-600">{req.estimatedWeight}</span> kg
        </span>
        <span className="flex items-center gap-1.5">
          <FaMoneyBillWave className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-medium text-gray-600">₹{req.estimatedPrice}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <FaCalendarAlt className="h-3.5 w-3.5 text-gray-400" />
          {req.scheduledAt ? formatDateTime(req.scheduledAt) : "ASAP"}
        </span>
      </div>

      {req.description && (
        <p className="text-sm text-gray-400 italic mb-3 line-clamp-2">{req.description}</p>
      )}

      <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 flex-shrink-0">
            <FaUser className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 truncate">
            <p className="text-sm font-medium text-gray-700 truncate">
              {req.resident?.name || "Resident"}
            </p>
            {req.resident?.email && (
              <p className="text-xs text-gray-400 truncate">{req.resident.email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onReject(req._id)}
            disabled={loading}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
              rejecting === req._id
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {rejecting === req._id ? (
              <span className="flex items-center gap-1.5"><Spinner /> Removing</span>
            ) : (
              <span className="flex items-center gap-1.5"><FaTimes className="h-3 w-3" /> Skip</span>
            )}
          </button>
          <button
            onClick={() => onAccept(req._id)}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-95 ${
              accepting === req._id
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-brand-600 hover:bg-brand-700 hover:shadow-md"
            }`}
          >
            {accepting === req._id ? (
              <span className="flex items-center gap-1.5"><Spinner /> Accepting</span>
            ) : (
              <span className="flex items-center gap-1.5">Accept <FaArrowRight className="h-3.5 w-3.5" /></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const AvailableRequests = () => {
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  const loadAvailable = async () => {
    try {
      const data = await getAvailablePickupsService();
      setRequests(data || []);
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
              <p className="font-semibold text-gray-800">New Pickup Available</p>
              <p className="text-sm text-gray-500">{request.pickupAddress}</p>
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
      } else {
        toast.error(msg);
      }
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return <div className="animate-fade-in"><ListSkeleton count={4} /></div>;

  return (
    <div className="mx-auto max-w-2xl animate-fade-in pb-8">
      <button
        onClick={() => navigate(ROUTES.COLLECTOR_DASHBOARD)}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        <FaArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Available Pickups</h2>
          <p className="text-sm text-gray-400 mt-1">
            {requests.length > 0
              ? `${requests.length} request${requests.length > 1 ? "s" : ""} waiting for a collector`
              : "No available requests right now"}
          </p>
        </div>
        <button
          onClick={loadAvailable}
          className="rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 active:scale-95"
        >
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
            <FaBroadcastTower className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-500">All caught up</p>
          <p className="mt-1 text-sm text-gray-400">Waiting for residents to request pickups...</p>
        </div>
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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableRequests;
