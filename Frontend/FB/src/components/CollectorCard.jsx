import { FaPhone, FaTruck } from "react-icons/fa";
import { getInitials, getCollectorStatus } from "../utils/helpers";

const CollectorCard = ({ collector, onSelect }) => {
  const status = getCollectorStatus(collector);
  const isAvailable = collector?.isAvailable && collector?.isApproved;

  return (
    <div
      onClick={() => onSelect?.(collector)}
      className="flex cursor-pointer items-center gap-4 rounded-xl border border-surface-200 bg-surface p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
        {getInitials(collector?.name)}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-surface-800">{collector?.name}</h3>

        {collector?.collectorDetails?.phone && (
          <p className="flex items-center gap-1 text-sm text-surface-500">
            <FaPhone className="text-xs" />
            {collector.collectorDetails.phone}
          </p>
        )}

        {collector?.collectorDetails?.vehicleNumber && (
          <p className="flex items-center gap-1 text-sm text-surface-500">
            <FaTruck className="text-xs" />
            {collector.collectorDetails.vehicleNumber}
          </p>
        )}
      </div>

      <div className="text-right">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            isAvailable
              ? "bg-brand-100 text-brand-700"
              : "bg-surface-100 text-surface-500"
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  );
};

export default CollectorCard;
