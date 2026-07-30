import {
  sendMessage,
  getMessages,
  markAsRead,
} from "../services/chatService.js";



export const getChatMessages = async (req, res) => {
  try {
    const messages = await getMessages(req.params.pickupId, req.user.id);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};



export const sendChatMessage = async (req, res) => {
  try {
    const { message, receiverId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    const chatMessage = await sendMessage(
      req.params.pickupId,
      req.user.id,
      receiverId,
      message.trim()
    );

    res.status(201).json({
      success: true,
      data: chatMessage,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};



export const markChatRead = async (req, res) => {
  try {
    const count = await markAsRead(req.params.pickupId, req.user.id);

    res.status(200).json({
      success: true,
      data: { modifiedCount: count },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};
