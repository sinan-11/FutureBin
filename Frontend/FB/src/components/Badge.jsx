const tones = {
  neutral:
    "bg-surface-100 text-surface-600 border-surface-200 dark:bg-surface-200/60 dark:text-surface-500 dark:border-surface-200",
  brand:
    "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20",
  success:
    "bg-success-50 text-success-700 border-success-200 dark:bg-success-500/10 dark:text-success-300 dark:border-success-500/20",
  warning:
    "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-500/10 dark:text-warning-300 dark:border-warning-500/20",
  danger:
    "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-500/10 dark:text-danger-300 dark:border-danger-500/20",
  info: "bg-info-50 text-info-700 border-info-200 dark:bg-info-500/10 dark:text-info-300 dark:border-info-500/20",
  teal: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
};

const dots = {
  neutral: "bg-surface-400",
  brand: "bg-brand-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-info-500",
  teal: "bg-teal-500",
};

const Badge = ({
  children,
  tone = "neutral",
  dot = false,
  pulse = false,
  className = "",
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dots[tone]} opacity-60`}
            />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
