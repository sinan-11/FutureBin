import { useState } from "react";
import { FaPlus, FaTrashCan, FaXmark, FaMessage } from "react-icons/fa6";

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const groupConversations = (conversations) => {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  const groups = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conversation of conversations) {
    const day = startOfDay(new Date(conversation.updatedAt || conversation.createdAt));

    let group;
    if (day >= today) group = 0;
    else if (day >= yesterday) group = 1;
    else if (day >= weekStart) group = 2;
    else group = 3;

    groups[group].items.push(conversation);
  }

  return groups.filter((group) => group.items.length > 0);
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const SidebarContent = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const groups = groupConversations(conversations);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 pb-2">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <FaPlus className="h-3.5 w-3.5" />
          New chat
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-surface-500 dark:text-surface-400 transition hover:bg-surface-100 dark:hover:bg-surface-200 hover:text-surface-800 dark:text-surface-800"
            aria-label="Close history"
          >
            <FaXmark className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <FaMessage className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300">No conversations yet</p>
            <p className="text-xs leading-relaxed text-surface-400 dark:text-surface-500">
              Start a new chat and your history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items.map((conversation) => {
                    const isActive = String(conversation._id) === String(activeId);
                    const time = formatTime(
                      conversation.updatedAt || conversation.createdAt
                    );
                    return (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() => onSelect(conversation)}
                        className={`group flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all ${
                          isActive
                            ? "bg-brand-50 text-brand-800 ring-1 ring-brand-100"
                            : "text-surface-600 dark:text-surface-500 hover:bg-surface-50 dark:bg-surface-200/40 hover:text-surface-900 dark:text-surface-900"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {conversation.title}
                          </p>
                          <p className="text-[11px] text-surface-400 dark:text-surface-500">
                            {formatDate(conversation.updatedAt || conversation.createdAt)}{" "}
                            · {time}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, conversation._id)}
                          disabled={deletingId === conversation._id}
                          className="flex-shrink-0 rounded-lg p-1.5 text-surface-400 dark:text-surface-500 opacity-0 transition hover:bg-danger-50 dark:hover:bg-danger-500/10 hover:text-danger-500 group-hover:opacity-100 disabled:opacity-50"
                          aria-label="Delete conversation"
                        >
                          <FaTrashCan className="h-3.5 w-3.5" />
                        </button>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationSidebar = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  open,
  onClose,
}) => (
  <>
    <aside className="hidden w-72 flex-shrink-0 border-r border-surface-100 dark:border-surface-200/60 bg-white dark:bg-surface-100 lg:block">
      <SidebarContent
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelect}
        onNew={onNew}
        onDelete={onDelete}
      />
    </aside>

    {open && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-surface-100 shadow-2xl animate-fade-in">
          <SidebarContent
            conversations={conversations}
            activeId={activeId}
            onSelect={onSelect}
            onNew={onNew}
            onDelete={onDelete}
            onClose={onClose}
          />
        </div>
      </div>
    )}
  </>
);

export default ConversationSidebar;
