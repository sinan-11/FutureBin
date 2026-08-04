import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  hasMore: false,
  loadingConversations: false,
  loadingMessages: false,
  sending: false,
  streamingText: "",
  error: null,
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setActiveConversationId: (state, action) => {
      state.activeConversationId = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setHasMore: (state, action) => {
      state.hasMore = action.payload;
    },
    appendMessage: (state, action) => {
      if (!action.payload || typeof action.payload !== "object") return;
      state.messages = [...state.messages, action.payload];
    },
    prependMessages: (state, action) => {
      const valid = (action.payload || []).filter(
        (m) => m && typeof m === "object"
      );
      if (valid.length > 0) {
        state.messages = [...valid, ...state.messages];
      }
    },
    removeOptimisticMessages: (state) => {
      state.messages = state.messages.filter(
        (m) => !String(m._id).startsWith("temp-")
      );
    },
    setAiLoading: (state, action) => {
      if (action.payload?.type === "conversations") {
        state.loadingConversations = action.payload.value;
      } else if (action.payload?.type === "messages") {
        state.loadingMessages = action.payload.value;
      }
    },
    setAiSending: (state, action) => {
      state.sending = action.payload;
    },
    setStreamingText: (state, action) => {
      state.streamingText = action.payload;
    },
    setAiError: (state, action) => {
      state.error = action.payload;
    },
    clearAiError: (state) => {
      state.error = null;
    },
    resetAi: (state) => {
      state.conversations = [];
      state.activeConversationId = null;
      state.messages = [];
      state.hasMore = false;
      state.loadingConversations = false;
      state.loadingMessages = false;
      state.sending = false;
      state.streamingText = "";
      state.error = null;
    },
  },
});

export const {
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
  resetAi,
} = aiSlice.actions;

export default aiSlice.reducer;

export const selectConversations = (state) => state.ai.conversations;
export const selectActiveConversationId = (state) => state.ai.activeConversationId;
export const selectMessages = (state) => state.ai.messages;
export const selectHasMore = (state) => state.ai.hasMore;
export const selectAiLoading = (state) => state.ai.loadingMessages || state.ai.loadingConversations;
export const selectAiSending = (state) => state.ai.sending;
export const selectStreamingText = (state) => state.ai.streamingText;
export const selectAiError = (state) => state.ai.error;
