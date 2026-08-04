import { memo } from "react";

const UserMessage = memo(function UserMessage({ content }) {
  return (
    <div className="flex w-full justify-end animate-fade-in">
      <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-white shadow-md shadow-emerald-600/15 sm:max-w-[70%]">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
});

export default UserMessage;
