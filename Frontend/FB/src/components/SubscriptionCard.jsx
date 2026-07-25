import {
  FaCalendarAlt, FaRecycle, FaWeight, FaMoneyBillWave,
  FaPause, FaPlay, FaTimes, FaTrashAlt, FaEdit, FaClock,
} from "react-icons/fa";
import { formatDateTime } from "../utils/helpers";

const STATUS_STYLES = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SubscriptionCard = ({ subscription, onEdit, onPause, onResume, onCancel, onDelete }) => {
  const statusStyle = STATUS_STYLES[subscription.status] || STATUS_STYLES.active;

  const scheduleLabel =
    subscription.frequency === "weekly"
      ? `Every ${DAYS[subscription.dayOfWeek]} at ${subscription.pickupTime}`
      : `Day ${subscription.dayOfMonth} of each month at ${subscription.pickupTime}`;

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
            <FaCalendarAlt className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 capitalize">{subscription.frequency} Subscription</p>
            <p className="text-xs text-gray-400">{scheduleLabel}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.color}`}>
          {statusStyle.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FaRecycle className="h-3.5 w-3.5 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Waste Type</p>
            <p className="text-sm font-medium text-gray-700 capitalize">{subscription.wasteType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FaWeight className="h-3.5 w-3.5 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Est. Weight</p>
            <p className="text-sm font-medium text-gray-700">{subscription.estimatedWeight} kg</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FaMoneyBillWave className="h-3.5 w-3.5 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Payment</p>
            <p className="text-sm font-medium text-gray-700 capitalize">{subscription.paymentMethod}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FaClock className="h-3.5 w-3.5 text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Next Pickup</p>
            <p className="text-sm font-medium text-gray-700">
              {subscription.nextRunAt ? formatDateTime(subscription.nextRunAt) : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {subscription.lastPickupRequest && (
        <div className="mb-3 rounded-xl bg-gray-50 p-2.5 text-xs text-gray-500">
          Last pickup: {subscription.lastPickupRequest.status} — {formatDateTime(subscription.lastPickupRequest.completedAt)}
        </div>
      )}

      {subscription.consecutiveFailures > 0 && (
        <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-600">
          {subscription.consecutiveFailures} consecutive failure(s) — wallet may have insufficient balance
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {subscription.status === "active" && (
          <>
            <button
              onClick={() => onEdit(subscription)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition"
            >
              <FaEdit className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={() => onPause(subscription._id)}
              className="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 transition"
            >
              <FaPause className="h-3 w-3" /> Pause
            </button>
            <button
              onClick={() => onCancel(subscription._id)}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
            >
              <FaTimes className="h-3 w-3" /> Cancel
            </button>
          </>
        )}
        {subscription.status === "paused" && (
          <>
            <button
              onClick={() => onResume(subscription._id)}
              className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
            >
              <FaPlay className="h-3 w-3" /> Resume
            </button>
            <button
              onClick={() => onCancel(subscription._id)}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
            >
              <FaTimes className="h-3 w-3" /> Cancel
            </button>
          </>
        )}
        {subscription.status === "cancelled" && (
          <button
            onClick={() => onDelete(subscription._id)}
            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            <FaTrashAlt className="h-3 w-3" /> Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
