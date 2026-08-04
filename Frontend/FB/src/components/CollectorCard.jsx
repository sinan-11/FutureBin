import { FaPhone, FaTruck } from "react-icons/fa";
import { getInitials, getCollectorStatus } from "../utils/helpers";

const CollectorCard = ({ collector, onSelect }) => {
  const status = getCollectorStatus(collector);
  const isAvailable = collector?.isAvailable && collector?.isApproved;

  return (
    <div
      onClick={() => onSelect?.(collector)}
      className="card card-hover flex cursor-pointer items-center gap-4 p-5"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20">
        {getInitials(collector?.name)}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-surface-800 dark:text-surface-800">
          {collector?.name}
        </h3>

        {collector?.collectorDetails?.phone && (
          <p className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
            <FaPhone className="h-3 w-3" />
            {collector.collectorDetails.phone}
          </p>
        )}

        {collector?.collectorDetails?.vehicleNumber && (
          <p className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400">
            <FaTruck className="h-3 w-3" />
            {collector.collectorDetails.vehicleNumber}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            isAvailable
              ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
              : "bg-surface-100 text-surface-500 dark:bg-surface-200/60 dark:text-surface-500"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default CollectorCard;
