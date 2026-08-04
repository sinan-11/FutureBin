import { FaRecycle } from "react-icons/fa";

const Loader = ({ fullScreen = true, label = "Loading..." }) => {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen" : "py-16"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-500/20 border-t-brand-500"></div>
          <FaRecycle className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-brand-500" />
        </div>
        <p className="animate-pulse text-sm font-medium text-surface-500 dark:text-surface-400">
          {label}
        </p>
      </div>
    </div>
  );
};

export default Loader;
