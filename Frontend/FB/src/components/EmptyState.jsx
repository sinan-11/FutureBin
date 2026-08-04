const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = "",
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-10" : "py-16"
      } ${className}`}
    >
      <div className="relative mb-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20">
          {Icon && <Icon className="h-7 w-7" />}
        </div>
        <div className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-brand-400/40 animate-pulse-soft" />
      </div>

      <h3 className="text-base font-semibold text-surface-800 dark:text-surface-800">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-surface-500 dark:text-surface-400">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
