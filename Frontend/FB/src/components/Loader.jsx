const Loader = ({ fullScreen = true }) => {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen" : "py-12"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-400 border-t-transparent"></div>
        <p className="animate-pulse text-sm text-surface-500">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;
