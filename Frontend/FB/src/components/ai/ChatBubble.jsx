import { memo } from "react";
import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

const ChatBubble = memo(function ChatBubble({
  message,
  streaming = false,
  onAction,
  role,
}) {
  if (message.role === "user") {
    return <UserMessage content={message.content} />;
  }

  return (
    <AssistantMessage
      content={message.content}
      card={message.card}
      time={message.createdAt}
      streaming={streaming}
      onAction={onAction}
      role={role}
    />
  );
});

export default ChatBubble;
