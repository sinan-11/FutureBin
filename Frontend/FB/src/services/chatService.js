import * as chatApi from "../api/chatApi";
import { getErrorMessage } from "../utils/helpers";

export const getChatMessagesService = async (pickupId) => {
  try {
    const response = await chatApi.getChatMessages(pickupId);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const sendChatMessageService = async (pickupId, message, receiverId) => {
  try {
    const response = await chatApi.sendChatMessage(pickupId, message, receiverId);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const markChatReadService = async (pickupId) => {
  try {
    const response = await chatApi.markChatRead(pickupId);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};
