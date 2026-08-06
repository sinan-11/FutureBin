import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaTimes,
  FaPaperPlane,
  FaCheck,
  FaCheckDouble,
  FaComments,
} from "react-icons/fa";
import useAuth from "../hooks/useAuth";
import Loader from "./Loader";
import {
  getChatMessagesService,
  sendChatMessageService,
  markChatReadService,
} from "../services/chatService";

const CHAT_PANEL_KEYFRAMES = `
  @keyframes chatBackdropIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes chatPanelIn { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
`;

const CHAT_ACTIVE_STATUSES = [
  "accepted",
  "collector_arrived",
  "collecting",
  "weight_verified",
  "payment_pending",
  "paid",
];

const ChatPanel = ({ pickup, socketRef, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const pickupId = pickup?._id;
  const isChatActive = CHAT_ACTIVE_STATUSES.includes(pickup?.status);

  const otherParty =
    user?.role === "collector" ? pickup?.resident : pickup?.collector;

  const receiverId = otherParty?._id;

  const sentMessages = messages.filter((m) => m.senderId === user?._id);
  const hasSentMessages = sentMessages.length > 0;
  const allMessagesSeen =
    hasSentMessages && sentMessages.every((m) => m.read);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      isNearBottomRef.current = checkIfNearBottom();
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [checkIfNearBottom]);

  const loadMessages = useCallback(async () => {
    if (!pickupId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getChatMessagesService(pickupId);
      setMessages(data);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [pickupId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      if (isNearBottomRef.current) {
        scrollToBottom(false);
      }
    }
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (loading || messages.length === 0) return;

    const hasUnread = messages.some(
      (m) => m.receiverId === user?._id && !m.read
    );

    if (hasUnread && pickupId) {
      const socket = socketRef?.current;
      if (socket?.connected) {
        socket.emit("chat-read", { pickupId });
      } else {
        markChatReadService(pickupId).catch(() => {});
      }
    }
  }, [messages, loading, user?._id, pickupId, socketRef]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data?.message?.pickupId === pickupId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });

        if (data.message.receiverId === user?._id && pickupId) {
          if (socket?.connected) {
            socket.emit("chat-read", { pickupId });
          } else {
            markChatReadService(pickupId).catch(() => {});
          }
        }
      }
    };

    const handleError = (data) => {
      console.warn("[CHAT] Server error:", data.message);
    };

    const handleChatClosed = (data) => {
      if (data?.pickupId === pickupId) {
        setMessages([]);
        onCloseRef.current();
      }
    };

    const handleMessagesRead = (data) => {
      if (data?.pickupId === pickupId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?._id ? { ...m, read: true } : m
          )
        );
      }
    };

    socket.on("chat-message", handleNewMessage);
    socket.on("chat-error", handleError);
    socket.on("chat-closed", handleChatClosed);
    socket.on("messages-read", handleMessagesRead);

    return () => {
      socket.off("chat-message", handleNewMessage);
      socket.off("chat-error", handleError);
      socket.off("chat-closed", handleChatClosed);
      socket.off("messages-read", handleMessagesRead);
    };
  }, [socketRef, pickupId, user?._id]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !receiverId) return;

    setSending(true);
    setInput("");

    const socket = socketRef?.current;

    if (socket?.connected) {
      socket.emit("chat-message", {
        pickupId,
        message: text,
      });
      setSending(false);
    } else {
      try {
        const newMessage = await sendChatMessageService(
          pickupId,
          text,
          receiverId
        );
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      } catch {
        setInput(text);
      } finally {
        setSending(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateSeparator = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const shouldShowDateSeparator = (msg, prevMsg) => {
    if (!prevMsg) return true;
    const d1 = new Date(msg.createdAt).toDateString();
    const d2 = new Date(prevMsg.createdAt).toDateString();
    return d1 !== d2;
  };

  return (
    <>
      <style>{CHAT_PANEL_KEYFRAMES}</style>

      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16"
        style={{ animation: "chatBackdropIn 200ms ease-out" }}
      >
        <div
          className="flex w-full max-w-[400px] flex-col overflow-hidden rounded-2xl bg-white dark:bg-surface-100 shadow-popover dark:bg-surface-100 mx-4"
          style={{
            maxHeight: "min(620px, 82vh)",
            animation: "chatPanelIn 250ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* ───────── Header ───────── */}
          <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-200/60 bg-white dark:bg-surface-100 px-4 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold shrink-0 select-none">
                {otherParty?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-900 truncate">
                  {otherParty?.name || "User"}
                </h3>
                {hasSentMessages ? (
                  allMessagesSeen ? (
                    <p className="flex items-center gap-1 text-xs text-sky-600">
                      <FaCheckDouble className="h-3 w-3" />
                      Seen
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
                      <FaCheck className="h-3 w-3" />
                      Sent
                    </p>
                  )
                ) : (
                  <p className="text-xs text-success-600">
                    {isChatActive ? "Online" : "Offline"}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:bg-surface-200 hover:text-surface-600 dark:text-surface-500 transition-colors duration-200 shrink-0"
              aria-label="Close chat"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>

          {/* ───────── Messages ───────── */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3 min-h-0 bg-surface-50 dark:bg-surface-200/30"
          >
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader fullScreen={false} />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Unable to load messages
                </p>
                <button
                  onClick={loadMessages}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 active:scale-95 transition-all duration-200"
                >
                  Retry
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-surface-400 dark:bg-surface-200 dark:text-surface-500">
                  <FaComments className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  Start the conversation
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg, idx) => {
                  const isSent = msg.senderId === user?._id;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDate = shouldShowDateSeparator(msg, prevMsg);

                  return (
                    <div key={msg._id}>
                      {showDate && (
                        <div className="flex items-center justify-center py-2 gap-3">
                          <div className="h-px flex-1 bg-surface-200 dark:bg-surface-200/70" />
                          <span className="shrink-0 rounded-full bg-white dark:bg-surface-100 px-3 py-1 text-[11px] font-medium text-surface-500 dark:text-surface-400 shadow-sm border border-surface-100 dark:border-surface-200/60 select-none">
                            {formatDateSeparator(msg.createdAt)}
                          </span>
                          <div className="h-px flex-1 bg-surface-200 dark:bg-surface-200/70" />
                        </div>
                      )}
                      <div
                        className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`relative max-w-[70%] px-3.5 py-2 ${
                            isSent
                              ? "bg-emerald-500 text-white rounded-2xl rounded-br-md"
                              : "bg-white dark:bg-surface-100 text-surface-800 dark:text-surface-800 rounded-2xl rounded-bl-md shadow-sm"
                          }`}
                        >
                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span
                              className={`text-[11px] select-none ${
                                isSent ? "text-white/70" : "text-surface-400 dark:text-surface-500"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </span>
                            {isSent && (
                              msg.read ? (
                                <FaCheckDouble className="h-3 w-3 text-white/70" />
                              ) : (
                                <FaCheck className="h-3 w-3 text-white/70" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ───────── Input ───────── */}
          {isChatActive && (
            <div className="flex items-center gap-2 border-t border-surface-100 dark:border-surface-200/60 bg-white dark:bg-surface-100 px-3 py-3 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-full bg-surface-50 dark:bg-surface-200/30 border border-surface-200 px-5 py-3 text-sm text-surface-800 dark:text-surface-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 placeholder:text-surface-400 dark:text-surface-500"
                disabled={sending}
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-all duration-200 hover:bg-emerald-600 active:scale-95 disabled:bg-surface-200 dark:bg-surface-200/70 disabled:text-surface-400 dark:text-surface-500 disabled:cursor-not-allowed shadow-sm"
                aria-label="Send message"
              >
                <FaPaperPlane className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatPanel;
