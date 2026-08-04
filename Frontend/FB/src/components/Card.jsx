const Card = ({
  children,
  className = "",
  hover = false,
  padded = true,
  ...rest
}) => {
  return (
    <div
      {...rest}
      className={`card ${padded ? "p-5 sm:p-6" : ""} ${
        hover ? "card-hover" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
