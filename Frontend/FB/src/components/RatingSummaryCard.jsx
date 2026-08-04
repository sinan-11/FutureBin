import { FaStar, FaUser } from "react-icons/fa";

import StarRating from "./StarRating";
import RatingBreakdown from "./RatingBreakdown";

const RatingSummaryCard = ({
  averageRating = 0,
  totalReviews = 0,
  ratingBreakdown = {},
  userName,
}) => {
  return (
    <div className="rounded-2xl border border-surface-100 bg-white p-5 shadow-sm dark:border-surface-200/60 dark:bg-surface-100">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-warning-50 to-warning-100">
          <FaStar className="h-6 w-6 text-warning-500" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-surface-800 dark:text-surface-800">
              {averageRating > 0 ? averageRating.toFixed(1) : "—"}
            </span>
            <span className="text-sm text-surface-400 dark:text-surface-500">
              out of 5
            </span>
          </div>
          <p className="text-sm text-surface-400 dark:text-surface-500">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      {totalReviews > 0 && (
        <div className="mt-4">
          <RatingBreakdown breakdown={ratingBreakdown} totalReviews={totalReviews} />
        </div>
      )}
    </div>
  );
};

export default RatingSummaryCard;
