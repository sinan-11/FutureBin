import { memo } from "react";
import { FaBars, FaPlus } from "react-icons/fa";
import BackButton from "../BackButton";

const ConversationHeader = memo(function ConversationHeader({
  onNew,
  onToggleSidebar,
  backTo,
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-100 dark:border-surface-200/60 bg-surface/80 dark:bg-surface-100/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <BackButton to={backTo} />
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-surface-500 dark:text-surface-400 transition hover:bg-surface-100 dark:hover:bg-surface-200 hover:text-surface-800 dark:text-surface-800 active:scale-95 lg:hidden"
          aria-label="Toggle conversation history"
        >
          <FaBars className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-surface-900 dark:text-surface-900">
              FutureBin Assistant
            </h1>
            <p className="text-[11px] font-medium text-success-600">Connected</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md active:scale-95"
      >
        <FaPlus className="h-3 w-3" />
        New chat
      </button>
    </header>
  );
});

export default ConversationHeader;
