import { FaChevronDown } from "react-icons/fa";

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  error,
  className = "",
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
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full cursor-pointer appearance-none rounded-xl border bg-surface px-4 py-2.5 pr-10 text-sm text-surface-800 shadow-sm transition-all duration-200 outline-none focus:ring-2 dark:bg-surface-100 dark:text-surface-800 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-danger-400 focus:border-danger-500 focus:ring-danger-500/20"
              : "border-surface-200 focus:border-brand-500 focus:ring-brand-500/15 dark:border-surface-200 dark:focus:border-emerald-500"
          }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-danger-600 dark:text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
