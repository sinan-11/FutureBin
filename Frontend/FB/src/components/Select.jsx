const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  error,
}) => {
  const id = name || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="mb-2 block font-medium text-surface-700">
          {label}
        </label>
      )}

      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-lg border bg-surface px-4 py-3 outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/30"
            : "border-surface-300 focus:border-brand-500 focus:ring-brand-300"
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

      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
};

export default Select;
