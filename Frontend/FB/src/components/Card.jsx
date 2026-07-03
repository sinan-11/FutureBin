const Card = ({ children, className = "", hover = false }) => {
  return (
    <div
      className={`rounded-xl border border-surface-200 bg-surface p-6 shadow-sm transition-all duration-200 ${
        hover ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
