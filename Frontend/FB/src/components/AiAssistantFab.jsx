import { useLocation, useNavigate } from "react-router-dom";
import { FaRobot } from "react-icons/fa";

import { ROUTES } from "../utils/constants";

const AiAssistantFab = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === ROUTES.AI_ASSISTANT) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate(ROUTES.AI_ASSISTANT)}
      className="group fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-emerald-600 py-3 pl-4 pr-5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/40 transition hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
      aria-label="Ask the AI assistant"
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-75" />
        <FaRobot className="relative h-5 w-5" />
      </span>
      Ask AI
    </button>
  );
};

export default AiAssistantFab;
