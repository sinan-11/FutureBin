import ReviewCard from "./ReviewCard";
import EmptyState from "./EmptyState";

const ReviewList = ({ reviews = [], title = "Reviews" }) => {
  return (
    <div>
      {reviews.length > 0 && (
        <h3 className="mb-3 text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
          {title}
        </h3>
      )}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-surface-400 dark:text-surface-500">
          No reviews yet.
        </p>
      )}
    </div>
  );
};

export default ReviewList;
