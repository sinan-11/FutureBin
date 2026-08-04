import axios from "axios";

import axiosInstance from "./axiosInstance";
import store from "../store/store";
import {
  API_BASE_URL,
  API_ENDPOINTS,
} from "../utils/constants";
import { setAccessToken } from "../store/slices/authSlice";

export const createConversation = (title) =>
  axiosInstance.post(API_ENDPOINTS.AI_CREATE_CONVERSATION, { title });

export const getConversations = () =>
  axiosInstance.get(API_ENDPOINTS.AI_CONVERSATIONS);

export const getConversationMessages = (id, params) =>
  axiosInstance.get(API_ENDPOINTS.AI_CONVERSATION(id), { params });

export const deleteConversation = (id) =>
  axiosInstance.delete(API_ENDPOINTS.AI_CONVERSATION(id));

export const sendChat = (payload) =>
  axiosInstance.post(API_ENDPOINTS.AI_CHAT, payload);

// ─── SSE Streaming ───────────────────────────────────────────────────────────

let refreshPromise = null;

const getRefreshedToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
        {},
        { withCredentials: true }
      )
      .then((response) => response.data.accessToken)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const getAccessToken = () => store.getState().auth.accessToken;

const parseSseBlock = (block) => {
  let type = "message";
  let data = "";

  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      type = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice(5).trim();
    }
  }

  if (!data) return null;

  try {
    return { type, data: JSON.parse(data) };
  } catch {
    return { type, data };
  }
};

async function* readSse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop();

    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (event) yield event;
    }
  }
}

/**
 * Streams the AI assistant reply as Server-Sent Events.
 * Yields { type, data } for "meta" | "delta" | "tool" | "done" | "error".
 */
export async function* streamChat(payload) {
  const attempt = async (token) => {
    return fetch(`${API_BASE_URL}${API_ENDPOINTS.AI_STREAM_CHAT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  };

  let response = await attempt(getAccessToken());

  if (response.status === 401) {
    const newToken = await getRefreshedToken();
    store.dispatch(setAccessToken(newToken));
    response = await attempt(newToken);
  }

  if (!response.ok) {
    let message = "Failed to connect to the assistant";
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  yield* readSse(response);
}
