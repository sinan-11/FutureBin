import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const accentStyles = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  blue: "bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-400",
  amber: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
  red: "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent = "brand",
  delta,
  deltaLabel = "vs last month",
  isLoading = false,
  onClick,
}) => {
  const isUp = delta >= 0;

  return (
    <div
      onClick={onClick}
      className={`card card-hover relative overflow-hidden p-5 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div
        aria-hidden
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(circle, var(--color-brand-500) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-surface-500 dark:text-surface-400">
            {label}
          </p>
          {isLoading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-surface-200/70 dark:bg-surface-200/60" />
          ) : (
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-surface-800 dark:text-surface-800">
              {value}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              accentStyles[accent] || accentStyles.brand
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {!isLoading && delta !== undefined && (
        <div className="relative mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
              isUp
                ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                : "bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400"
            }`}
          >
            {isUp ? (
              <FaArrowUp className="h-2.5 w-2.5" />
            ) : (
              <FaArrowDown className="h-2.5 w-2.5" />
            )}
            {Math.abs(delta)}%
          </span>
          <span className="text-xs text-surface-400 dark:text-surface-500">
            {deltaLabel}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
