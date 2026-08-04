import StarRating from "./StarRating";

const RatingBreakdown = ({ breakdown = {}, totalReviews = 0 }) => {
  if (totalReviews === 0) return null;

  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = breakdown[star] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-2">
            <span className="w-8 text-right text-xs font-medium text-surface-500 dark:text-surface-400">
              {star}★
            </span>
            <div className="flex-1 h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-200/60">
              <div
                className="h-full rounded-full bg-warning-400 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-xs text-surface-400 dark:text-surface-500">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RatingBreakdown;
