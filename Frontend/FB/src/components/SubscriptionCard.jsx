import {
  FaCalendarAlt, FaRecycle, FaWeight, FaMoneyBillWave,
  FaPause, FaPlay, FaTimes, FaTrashAlt, FaEdit, FaClock,
} from "react-icons/fa";
import { formatDateTime } from "../utils/helpers";

const STATUS_STYLES = {
  active: { label: "Active", color: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300" },
  paused: { label: "Paused", color: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300" },
  cancelled: { label: "Cancelled", color: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SubscriptionCard = ({ subscription, onEdit, onPause, onResume, onCancel, onDelete }) => {
  const statusStyle = STATUS_STYLES[subscription.status] || STATUS_STYLES.active;

  const scheduleLabel =
    subscription.frequency === "weekly"
      ? `Every ${DAYS[subscription.dayOfWeek]} at ${subscription.pickupTime}`
      : `Day ${subscription.dayOfMonth} of each month at ${subscription.pickupTime}`;

  return (
    <div className="card card-hover animate-fade-in p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
            <FaCalendarAlt className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-surface-800 capitalize">{subscription.frequency} Subscription</p>
            <p className="text-xs text-surface-400 dark:text-surface-500">{scheduleLabel}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.color}`}>
          {statusStyle.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2">
          <FaRecycle className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
          <div>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider dark:text-surface-500">Waste Type</p>
            <p className="text-sm font-medium text-surface-700 capitalize dark:text-surface-300">{subscription.wasteType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FaWeight className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
          <div>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider dark:text-surface-500">Est. Weight</p>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{subscription.estimatedWeight} kg</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FaMoneyBillWave className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
          <div>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider dark:text-surface-500">Payment</p>
            <p className="text-sm font-medium text-surface-700 capitalize dark:text-surface-300">{subscription.paymentMethod}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FaClock className="h-3.5 w-3.5 text-surface-400 dark:text-surface-500" />
          <div>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider dark:text-surface-500">Next Pickup</p>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {subscription.nextRunAt ? formatDateTime(subscription.nextRunAt) : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {subscription.lastPickupRequest && (
        <div className="mb-3 rounded-xl bg-surface-100/60 p-2.5 text-xs text-surface-500 dark:bg-surface-200/40 dark:text-surface-400">
          Last pickup: {subscription.lastPickupRequest.status} — {formatDateTime(subscription.lastPickupRequest.completedAt)}
        </div>
      )}

      {subscription.consecutiveFailures > 0 && (
        <div className="mb-3 rounded-xl bg-danger-50 p-2.5 text-xs text-danger-600 dark:bg-danger-500/10 dark:text-danger-400">
          {subscription.consecutiveFailures} consecutive failure(s) — wallet may have insufficient balance
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100 dark:border-surface-200/60">
        {subscription.status === "active" && (
          <>
            <button
              onClick={() => onEdit(subscription)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
            >
              <FaEdit className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={() => onPause(subscription._id)}
              className="flex items-center gap-1.5 rounded-lg bg-warning-50 px-3 py-1.5 text-xs font-semibold text-warning-700 hover:bg-warning-100 transition dark:bg-warning-500/10 dark:text-warning-300 dark:hover:bg-warning-500/20"
            >
              <FaPause className="h-3 w-3" /> Pause
            </button>
            <button
              onClick={() => onCancel(subscription._id)}
              className="flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-100 transition dark:bg-danger-500/10 dark:text-danger-400 dark:hover:bg-danger-500/20"
            >
              <FaTimes className="h-3 w-3" /> Cancel
            </button>
          </>
        )}
        {subscription.status === "paused" && (
          <>
            <button
              onClick={() => onResume(subscription._id)}
              className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-100 transition dark:bg-success-500/10 dark:text-success-300 dark:hover:bg-success-500/20"
            >
              <FaPlay className="h-3 w-3" /> Resume
            </button>
            <button
              onClick={() => onCancel(subscription._id)}
              className="flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-100 transition dark:bg-danger-500/10 dark:text-danger-400 dark:hover:bg-danger-500/20"
            >
              <FaTimes className="h-3 w-3" /> Cancel
            </button>
          </>
        )}
        {subscription.status === "cancelled" && (
          <button
            onClick={() => onDelete(subscription._id)}
            className="flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-100 transition dark:bg-danger-500/10 dark:text-danger-400 dark:hover:bg-danger-500/20"
          >
            <FaTrashAlt className="h-3 w-3" /> Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
