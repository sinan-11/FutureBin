import * as aiApi from "../api/aiApi";
import { getErrorMessage } from "../utils/helpers";

export const getConversationsService = async () => {
  try {
    const res = await aiApi.getConversations();
    return res.data.data.conversations;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const createConversationService = async (title) => {
  try {
    const res = await aiApi.createConversation(title);
    return res.data.data.conversation;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const getConversationMessagesService = async (id, params = {}) => {
  try {
    const res = await aiApi.getConversationMessages(id, params);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const deleteConversationService = async (id) => {
  try {
    const res = await aiApi.deleteConversation(id);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const sendChatService = async (payload) => {
  try {
    const res = await aiApi.sendChat(payload);
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const streamChatService = async (payload, onEvent) => {
  try {
    for await (const event of aiApi.streamChat(payload)) {
      onEvent(event);
    }
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};
