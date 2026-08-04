const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  icon: Icon,
  hint,
  className = "",
  ...rest
}) => {
  const id = name || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
        >
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
        )}

        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          {...rest}
          className={`w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-surface-800 shadow-sm transition-all duration-200 outline-none placeholder:text-surface-400 dark:bg-surface-100 dark:text-surface-800 dark:placeholder:text-surface-500 disabled:cursor-not-allowed disabled:opacity-50 ${
            Icon ? "pl-10" : ""
          } ${
            error
              ? "border-danger-400 focus:border-danger-500 focus:ring-danger-500/20"
              : "border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-surface-200 dark:focus:border-emerald-500"
          }`}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-danger-600 dark:text-danger-400">
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="mt-1.5 text-xs text-surface-500 dark:text-surface-500">{hint}</p>
      )}
    </div>
  );
};

export default Input;
