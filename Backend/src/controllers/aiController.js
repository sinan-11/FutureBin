import * as aiService from "../services/aiService.js";
import { getUserById } from "../services/userService.js";

const getUser = async (req) => {
  return await getUserById(req.user.id);
};

// ─── Conversation CRUD ───────────────────────────────────────────────────────

export const createConversation = async (req, res) => {
  try {
    const { title } = req.body;

    const conversation = await aiService.createConversation(
      req.user.id,
      title
    );

    res.status(201).json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const listConversations = async (req, res) => {
  try {
    const conversations = await aiService.listConversations(req.user.id);

    res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { limit, before } = req.query;

    const result = await aiService.getConversationMessages(
      req.user.id,
      req.params.id,
      { limit, before }
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    await aiService.deleteConversation(req.user.id, req.params.id);

    res.status(200).json({
      success: true,
      message: "Conversation deleted",
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export const chat = async (req, res) => {
  try {
    const user = await getUser(req);

    const { conversationId, content, intent, label } = req.body;

    let result;

    if (intent) {
      result = await aiService.chatWithIntent(user._id, user, {
        conversationId,
        intent,
        label,
      });
    } else {
      result = await aiService.chatWithAssistant(user._id, user, {
        conversationId,
        content,
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const streamChat = async (req, res) => {
  try {
    const user = await getUser(req);

    const { conversationId, content } = req.body;

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    aiService.getAIClient();

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const send = (type, data) => {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    for await (const event of aiService.streamChat(user._id, user, {
      conversationId,
      content,
    })) {
      send(event.type, event.data);
    }

    res.end();
  } catch (error) {
    const status = error.status || 500;

    if (res.headersSent) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
      return;
    }

    res.status(status).json({ success: false, message: error.message });
  }
};

export default {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
  chat,
  streamChat,
};
