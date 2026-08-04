import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import ResponseCard from "./ResponseCard";

const AssistantMessage = memo(function AssistantMessage({
  content,
  card,
  time,
  streaming = false,
  onAction,
  role,
}) {
  return (
    <div className="flex w-full justify-start animate-fade-in">
      <div className="max-w-[92%] space-y-3 rounded-3xl rounded-bl-lg bg-white dark:bg-surface-100 px-4 py-3.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 sm:max-w-[75%]">
        {card && <ResponseCard card={card} onAction={onAction} role={role} />}

        {content && (
          <div className={`ai-markdown ${streaming ? "opacity-90" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        {!streaming && time && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-surface-400 dark:text-surface-500">
              {new Date(time).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default AssistantMessage;
