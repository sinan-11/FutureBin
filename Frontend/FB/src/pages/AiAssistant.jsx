import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import useAuth from "../hooks/useAuth";
import ConversationSidebar from "../components/ai/ConversationSidebar";
import ConversationHeader from "../components/ai/ConversationHeader";
import AIWelcome from "../components/ai/AIWelcome";
import ChatBubble from "../components/ai/ChatBubble";
import AssistantMessage from "../components/ai/AssistantMessage";
import TypingIndicator from "../components/ai/TypingIndicator";
import AIInput from "../components/ai/AIInput";
import FollowUpSuggestions from "../components/ai/FollowUpSuggestions";
import {
  getConversationsService,
  getConversationMessagesService,
  deleteConversationService,
  sendChatService,
  streamChatService,
} from "../services/aiService";
import {
  setConversations,
  setActiveConversationId,
  setMessages,
  setHasMore,
  appendMessage,
  prependMessages,
  removeOptimisticMessages,
  setAiLoading,
  setAiSending,
  setStreamingText,
  setAiError,
  clearAiError,
} from "../store/slices/aiSlice";
import {
  selectConversations,
  selectActiveConversationId,
  selectMessages,
  selectHasMore,
  selectAiSending,
  selectStreamingText,
  selectAiError,
} from "../store/slices/aiSlice";
import { ROUTES, ROLES } from "../utils/constants";
import { getDashboardRoute } from "../utils/helpers";
import {
  getPromptSuggestionsForRole,
  filterActionsForRole,
} from "../utils/aiActions";

const resolvePath = (path, role) => {
  switch (path) {
    case "wallet":
      return role === ROLES.COLLECTOR
        ? ROUTES.COLLECTOR_WALLET
        : ROUTES.RESIDENT_WALLET;
    case "subscriptions":
      return ROUTES.RESIDENT_MY_SUBSCRIPTIONS;
    default:
      return getDashboardRoute(role);
  }
};

const AiAssistant = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const conversations = useSelector(selectConversations);
  const activeConversationId = useSelector(selectActiveConversationId);
  const messages = useSelector(selectMessages);
  const hasMore = useSelector(selectHasMore);
  const loadingConversations = useSelector(
    (state) => state.ai.loadingConversations
  );
  const loadingMessages = useSelector((state) => state.ai.loadingMessages);
  const sending = useSelector(selectAiSending);
  const streamingText = useSelector(selectStreamingText);
  const error = useSelector(selectAiError);

  const [suggestions, setSuggestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef(null);
  const chatInputRef = useRef(null);

  const promptSuggestions = useMemo(() => getPromptSuggestionsForRole(role), [role]);

  const loadConversations = useCallback(async () => {
    dispatch(setAiLoading({ type: "conversations", value: true }));
    try {
      const list = await getConversationsService();
      dispatch(setConversations(list));
    } catch (err) {
      dispatch(setAiError(err.message));
    } finally {
      dispatch(setAiLoading({ type: "conversations", value: false }));
    }
  }, [dispatch]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const scrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, sending, activeConversationId, scrollToBottom]);

  const newChat = useCallback(() => {
    dispatch(setActiveConversationId(null));
    dispatch(setMessages([]));
    dispatch(setHasMore(false));
    dispatch(setStreamingText(""));
    setSuggestions([]);
    setSidebarOpen(false);
    dispatch(clearAiError());
    chatInputRef.current?.focus();
  }, [dispatch]);

  const selectConversation = useCallback(
    async (conversation) => {
      dispatch(setActiveConversationId(conversation._id));
      dispatch(setMessages([]));
      dispatch(setHasMore(false));
      dispatch(setStreamingText(""));
      setSuggestions([]);
      setSidebarOpen(false);
      dispatch(clearAiError());
      dispatch(setAiLoading({ type: "messages", value: true }));
      try {
        const data = await getConversationMessagesService(conversation._id);
        dispatch(setMessages(data.messages));
        dispatch(setHasMore(data.hasMore));
      } catch (err) {
        dispatch(setAiError(err.message));
      } finally {
        dispatch(setAiLoading({ type: "messages", value: false }));
      }
    },
    [dispatch]
  );

  const handleDelete = useCallback(
    async (id) => {
      await deleteConversationService(id);
      if (String(id) === String(activeConversationId)) {
        newChat();
      }
      await loadConversations();
    },
    [activeConversationId, loadConversations, newChat]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMessages || !activeConversationId || messages.length === 0) {
      return;
    }
    const before = messages[0]._id;
    dispatch(setAiLoading({ type: "messages", value: true }));
    try {
      const data = await getConversationMessagesService(activeConversationId, {
        before,
      });
      dispatch(prependMessages(data.messages));
      dispatch(setHasMore(data.hasMore));
    } catch (err) {
      dispatch(setAiError(err.message));
    } finally {
      dispatch(setAiLoading({ type: "messages", value: false }));
    }
  }, [hasMore, loadingMessages, activeConversationId, messages, dispatch]);

  const handleAction = useCallback(
    async (action) => {
      if (action.path) {
        navigate(resolvePath(action.path, role));
        return;
      }
      if (!action.intent) return;

      dispatch(setAiSending(true));
      setSuggestions([]);
      dispatch(clearAiError());
      try {
        const result = await sendChatService({
          conversationId: activeConversationId,
          intent: action.intent,
          label: action.label,
        });
        dispatch(setActiveConversationId(result.conversation._id));
        dispatch(appendMessage(result.userMessage));
        dispatch(appendMessage(result.assistantMessage));
        setSuggestions(filterActionsForRole(result.suggestedActions || [], role));
        loadConversations();
      } catch (err) {
        dispatch(setAiError(err.message));
      } finally {
        dispatch(setAiSending(false));
      }
    },
    [activeConversationId, dispatch, navigate, role, loadConversations]
  );

  const handleSend = useCallback(
    async (text) => {
      dispatch(setAiSending(true));
      setSuggestions([]);
      dispatch(clearAiError());
      dispatch(appendMessage({ _id: `temp-${Date.now()}`, role: "user", content: text }));

      let accumulated = "";

      try {
        await streamChatService(
          { conversationId: activeConversationId, content: text },
          (event) => {
            if (event.type === "meta") {
              if (event.data.conversationId) {
                dispatch(setActiveConversationId(event.data.conversationId));
              }
            } else if (event.type === "delta") {
              accumulated += event.data.text || "";
              dispatch(setStreamingText(accumulated));
            } else if (event.type === "done") {
              dispatch(setStreamingText(""));
              dispatch(removeOptimisticMessages());
              dispatch(appendMessage(event.data.userMessage));
              dispatch(appendMessage(event.data.assistantMessage));
              setSuggestions(
                filterActionsForRole(event.data.suggestedActions || [], role)
              );
            } else if (event.type === "error") {
              dispatch(setAiError(event.data?.message || "Something went wrong"));
            }
          }
        );
        loadConversations();
      } catch (err) {
        dispatch(setStreamingText(""));
        dispatch(removeOptimisticMessages());
        dispatch(setAiError(err.message));
      } finally {
        dispatch(setAiSending(false));
      }
    },
    [activeConversationId, dispatch, loadConversations, role]
  );

  const handlePromptSelect = useCallback(
    (item) => {
      if (item.intent) {
        handleAction(item);
      } else if (item.prompt) {
        handleSend(item.prompt);
      }
    },
    [handleAction, handleSend]
  );

  const showWelcome =
    !loadingMessages && messages.length === 0 && !sending && !streamingText;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        loading={loadingConversations}
        onSelect={selectConversation}
        onNew={newChat}
        onDelete={handleDelete}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <ConversationHeader
          onNew={newChat}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          backTo={getDashboardRoute(role)}
        />

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          {loadingMessages && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
            </div>
          ) : showWelcome ? (
            <AIWelcome
              user={user}
              suggestions={promptSuggestions}
              onSelect={handlePromptSelect}
              disabled={sending}
            />
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMessages}
                    className="rounded-full border border-surface-200 bg-white px-3.5 py-1.5 text-xs font-medium text-surface-500 transition hover:border-emerald-500/50 hover:text-brand-700 dark:border-surface-200 dark:bg-surface-100 dark:text-surface-400 disabled:opacity-50"
                  >
                    {loadingMessages ? "Loading..." : "Load earlier messages"}
                  </button>
                </div>
              )}

              {messages.map((message) => (
                <ChatBubble
                  key={message._id}
                  message={message}
                  onAction={handleAction}
                  role={role}
                />
              ))}

              {sending && !streamingText && <TypingIndicator />}
              {streamingText && (
                <AssistantMessage content={streamingText} streaming />
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-auto flex w-full max-w-3xl items-start gap-2 px-4 pb-2">
            <div className="flex w-full items-start gap-2 rounded-xl border border-danger-500/25 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 dark:bg-danger-500/10 dark:text-danger-300">
              <FaExclamationCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <FollowUpSuggestions
          actions={suggestions}
          onSelect={handleAction}
          disabled={sending}
        />

        <AIInput ref={chatInputRef} onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
};

export default AiAssistant;
