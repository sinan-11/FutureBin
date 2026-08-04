import { useState } from "react";
import { FaStar } from "react-icons/fa";

import StarRating from "./StarRating";
import Button from "./Button";

const RESIDENT_TAGS = [
  "Friendly",
  "Professional",
  "Arrived On Time",
  "Quick Service",
  "Handled Waste Carefully",
  "Clean Work",
];

const COLLECTOR_TAGS = [
  "Friendly",
  "Ready On Arrival",
  "Accurate Waste Estimate",
  "Easy Communication",
  "Prompt Payment",
  "Respectful",
];

const ReviewModal = ({
  isOpen,
  onClose,
  revieweeName,
  reviewerRole,
  pickupAddress,
  onSubmit,
  loading,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  const availableTags = reviewerRole === "resident" ? RESIDENT_TAGS : COLLECTOR_TAGS;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit({ rating, comment, tags: selectedTags });
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    setSelectedTags([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in dark:bg-surface-100">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-warning-50 to-warning-100">
            <FaStar className="h-5 w-5 text-warning-500" />
          </div>
          <h3 className="text-lg font-bold text-surface-800 dark:text-surface-800">
            {reviewerRole === "resident" ? "Rate Collector" : "Rate Resident"}
          </h3>
          <p className="mt-1 text-sm text-surface-400 dark:text-surface-500">
            {revieweeName}
            {pickupAddress && (
              <span className="block text-xs text-surface-300 dark:text-surface-400 mt-0.5">
                {pickupAddress}
              </span>
            )}
          </p>
        </div>

        <div className="flex justify-center mb-5">
          <StarRating rating={rating} onChange={setRating} size="xl" />
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
            Tags (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/30"
                    : "bg-surface-50 text-surface-500 border-surface-200 hover:bg-surface-100 dark:bg-surface-200/40 dark:text-surface-400 dark:border-surface-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">
            Comment (optional)
          </p>
          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Share your experience..."
              className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-4 py-3 text-sm text-surface-800 placeholder:text-surface-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-200 dark:bg-surface-200/40 dark:text-surface-800 dark:placeholder:text-surface-400 resize-none"
            />
            <span className="absolute bottom-2 right-3 text-xs text-surface-300 dark:text-surface-400">
              {comment.length}/500
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={rating < 1 || loading}
            loading={loading}
          >
            Submit Review
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
