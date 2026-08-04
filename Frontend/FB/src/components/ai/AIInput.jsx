import { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { FaArrowUp } from "react-icons/fa";

const AIInput = forwardRef(function AIInput(
  {
    onSend,
    disabled,
    placeholder = "Ask about pickups, wallets, subscriptions, reviews or anything...",
  },
  ref
) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setValue: (value) => setText(value || ""),
    focus: () => textareaRef.current?.focus(),
  }));

  const canSend = text.trim().length > 0 && !disabled;

  const handleSubmit = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setText("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleKeyUp = (e) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="shrink-0 border-t border-surface-100 dark:border-surface-200/60 bg-surface/80 dark:bg-surface-100/80 px-3 pb-3 pt-2 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <div className="flex flex-1 items-end rounded-3xl border border-surface-200 bg-surface-50/80 dark:bg-surface-200/40 px-3 py-2 shadow-sm transition focus-within:border-emerald-500/60 focus-within:bg-white dark:focus-within:bg-surface-100 focus-within:ring-4 focus-within:ring-emerald-500/15">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            rows={1}
            placeholder={placeholder}
            disabled={disabled}
            aria-label="Message"
            className="max-h-40 w-full resize-none bg-transparent px-1 text-sm text-surface-800 dark:text-surface-800 outline-none placeholder:text-surface-400 dark:text-surface-500 disabled:opacity-60"
          />
          <div className="flex shrink-0 items-center gap-1 pl-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md active:scale-90 disabled:cursor-not-allowed disabled:bg-surface-200 dark:bg-surface-200 disabled:text-surface-400 dark:text-surface-500"
              aria-label="Send message"
            >
              <FaArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-1.5 max-w-3xl text-center text-[10px] text-surface-400 dark:text-surface-500">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
});

export default AIInput;
