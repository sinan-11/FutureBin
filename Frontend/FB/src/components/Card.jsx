const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`rounded-xl bg-white p-8 shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;