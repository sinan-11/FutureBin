const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-300 shadow-sm",
  secondary: "bg-surface text-brand-600 border-2 border-brand-600 hover:bg-brand-50 focus:ring-brand-200",
  danger: "bg-danger text-white hover:bg-red-600 focus:ring-red-300",
  ghost: "bg-transparent text-surface-600 hover:bg-surface-100 focus:ring-surface-200",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

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
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="h-5 w-5" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
