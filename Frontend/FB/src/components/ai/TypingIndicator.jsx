import { memo } from "react";

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex w-full justify-start animate-fade-in">
      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-lg bg-white dark:bg-surface-100 px-4 py-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-brand-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
});

export default TypingIndicator;
