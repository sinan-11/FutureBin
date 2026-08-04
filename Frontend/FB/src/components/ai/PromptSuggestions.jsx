import { memo } from "react";

const PromptSuggestions = memo(function PromptSuggestions({
  suggestions = [],
  onSelect,
  disabled,
}) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.label}-${index}`}
          type="button"
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="group flex items-center gap-2 rounded-full border border-surface-200 bg-white dark:bg-surface-100 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-brand-50 hover:text-brand-800 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
});

export default PromptSuggestions;
