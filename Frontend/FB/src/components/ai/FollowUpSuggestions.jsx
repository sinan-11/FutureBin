import { memo } from "react";

const FollowUpSuggestions = memo(function FollowUpSuggestions({
  actions = [],
  onSelect,
  disabled,
}) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 px-4 pb-2">
      {actions.map((action, index) => (
        <button
          key={action.intent || action.path || index}
          type="button"
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/60 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-brand-100 hover:shadow-sm active:scale-95 disabled:opacity-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
});

export default FollowUpSuggestions;
