import { FaUser, FaTruck } from "react-icons/fa";

import StarRating from "./StarRating";
import { formatDateTime, capitalize } from "../utils/helpers";

const ReviewCard = ({ review }) => {
  if (!review) return null;

  const reviewerName = review.reviewer?.name || "User";
  const reviewerRole = review.reviewerRole || review.reviewer?.role || "user";
  const roleLabel = capitalize(reviewerRole);

  return (
    <div className="rounded-xl border border-surface-100 bg-white p-4 shadow-sm dark:border-surface-200/60 dark:bg-surface-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-200/60">
            {reviewerRole === "collector" ? (
              <FaTruck className="h-4 w-4 text-surface-400 dark:text-surface-500" />
            ) : (
              <FaUser className="h-4 w-4 text-surface-400 dark:text-surface-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800 dark:text-surface-800">
              {reviewerName}
            </p>
            <p className="text-xs text-surface-400 dark:text-surface-500">{roleLabel}</p>
          </div>
        </div>
        <StarRating rating={review.rating} readonly size="sm" />
      </div>

      {review.tags && review.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {review.comment && (
        <p className="mt-3 text-sm text-surface-600 dark:text-surface-500 leading-relaxed">
          &ldquo;{review.comment}&rdquo;
        </p>
      )}

      <p className="mt-2 text-xs text-surface-300 dark:text-surface-400">
        {formatDateTime(review.createdAt)}
      </p>
    </div>
  );
};

export default ReviewCard;
