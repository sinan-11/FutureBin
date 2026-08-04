import { useState } from "react";
import { FaStar } from "react-icons/fa";

const StarRating = ({
  rating = 0,
  onChange,
  size = "md",
  readonly = false,
  showValue = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
    xl: "h-9 w-9",
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`${readonly ? "cursor-default" : "cursor-pointer"} focus:outline-none transition-transform ${!readonly && "hover:scale-110 active:scale-95"}`}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <FaStar
            className={`${sizes[size]} transition-colors ${
              star <= activeRating
                ? "text-warning-500"
                : "text-surface-200 dark:text-surface-200/60"
            }`}
          />
        </button>
      ))}
      {showValue && rating > 0 && (
        <span className="ml-1 text-sm font-semibold text-surface-700 dark:text-surface-300">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
