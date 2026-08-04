import { FaStar } from "react-icons/fa";

import Button from "./Button";

const ReviewButton = ({
  hasReviewed,
  onClick,
  loading,
  className = "",
}) => {
  if (hasReviewed) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-xl bg-success-50 px-4 py-2.5 text-sm font-bold text-success-700 dark:bg-success-500/10 dark:text-success-300 ${className}`}>
        <FaStar className="h-3.5 w-3.5" /> Review Submitted
      </span>
    );
  }

  return (
    <Button
      variant="primary"
      size="md"
      onClick={onClick}
      disabled={loading}
      loading={loading}
      className={`!bg-warning-600 hover:!bg-warning-500 active:!bg-warning-700 focus-visible:!ring-warning-500/50 ${className}`}
    >
      <span className="flex items-center gap-1.5">
        <FaStar className="h-3.5 w-3.5" />
        Leave Review
      </span>
    </Button>
  );
};

export default ReviewButton;
