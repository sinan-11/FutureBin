import PromptSuggestions from "./PromptSuggestions";

const getGreeting = (hour = new Date().getHours()) => {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const AIWelcome = ({ user, suggestions, onSelect, disabled }) => {
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/25">
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="8" width="16" height="12" rx="2" />
            <path d="M12 8V4m0 0l-2 2m2-2l2 2" />
            <circle cx="9" cy="13" r="1" />
            <circle cx="15" cy="13" r="1" />
            <path d="M9 17h6" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-900 sm:text-3xl animate-fade-in">
          {getGreeting()}, {firstName}
        </h2>
        <p className="mt-3 text-lg font-semibold text-brand-700 animate-fade-in">
          FutureBin Assistant
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-surface-500 dark:text-surface-400 animate-fade-in">
          I can help you with pickups, wallets, payments, subscriptions, earnings,
          waste guidance, availability, and more.
        </p>

        <div className="mt-8 animate-slide-up">
          <PromptSuggestions
            suggestions={suggestions}
            onSelect={onSelect}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default AIWelcome;
