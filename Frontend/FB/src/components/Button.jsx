const variants = {
  primary:
    "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/25 active:bg-emerald-700 focus-visible:ring-emerald-500/50",
  secondary:
    "bg-surface-100 text-surface-700 border border-surface-200 hover:bg-surface-200 hover:text-surface-800 dark:bg-surface-100 dark:text-surface-700 dark:border-surface-200 dark:hover:bg-surface-200 focus-visible:ring-surface-400/40",
  outline:
    "bg-transparent text-emerald-700 border border-emerald-600/70 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-500/60 dark:hover:bg-emerald-500/10 focus-visible:ring-emerald-500/40",
  ghost:
    "bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-800 dark:text-surface-500 dark:hover:bg-surface-100 dark:hover:text-surface-800 focus-visible:ring-surface-400/40",
  danger:
    "bg-danger-600 text-white shadow-sm shadow-danger-600/20 hover:bg-danger-500 active:bg-danger-700 focus-visible:ring-danger-500/50",
  success:
    "bg-success-500 text-white shadow-sm shadow-success-500/20 hover:bg-success-400 active:bg-success-600 focus-visible:ring-success-500/50",
  white:
    "bg-white text-surface-800 border border-surface-200 shadow-sm hover:bg-surface-50 dark:bg-surface-100 dark:text-surface-800 dark:border-surface-200 dark:hover:bg-surface-200 focus-visible:ring-surface-400/40",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
  xl: "px-7 py-3.5 text-base gap-2.5",
};

const Spinner = ({ className = "h-4 w-4" }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export { Spinner };

const Button = ({
  children,
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "lg",
  className = "",
  icon: Icon,
  fullWidth = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex select-none items-center justify-center overflow-hidden rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 dark:focus-visible:ring-offset-surface-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${
        loading ? "cursor-wait" : "cursor-pointer"
      } ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <Spinner className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : Icon ? (
        <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
