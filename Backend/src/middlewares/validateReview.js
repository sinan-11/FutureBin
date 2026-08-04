const VALID_TAGS = {
  resident: [
    "Friendly",
    "Professional",
    "Arrived On Time",
    "Quick Service",
    "Handled Waste Carefully",
    "Clean Work",
  ],
  collector: [
    "Friendly",
    "Ready On Arrival",
    "Accurate Waste Estimate",
    "Easy Communication",
    "Prompt Payment",
    "Respectful",
  ],
};

const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "")
    .trim();
};

export const validateCreateReview = (body, userRole) => {
  const errors = [];

  const { pickup, rating, comment, tags } = body;

  if (!pickup || typeof pickup !== "string") {
    errors.push("Pickup ID is required");
  }

  if (rating === undefined || rating === null) {
    errors.push("Rating is required");
  } else {
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5 || numRating !== Math.floor(numRating)) {
      errors.push("Rating must be an integer between 1 and 5");
    }
  }

  if (comment !== undefined && comment !== null && typeof comment === "string") {
    const cleanComment = sanitizeString(comment);
    if (cleanComment.length > 500) {
      errors.push("Comment cannot exceed 500 characters");
    }
  }

  if (tags !== undefined && tags !== null) {
    if (!Array.isArray(tags)) {
      errors.push("Tags must be an array");
    } else {
      const allowedTags = VALID_TAGS[userRole] || [];
      for (const tag of tags) {
        if (typeof tag !== "string" || !allowedTags.includes(tag)) {
          errors.push(`Invalid tag: "${tag}". Allowed tags: ${allowedTags.join(", ")}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(". "));
    err.status = 400;
    throw err;
  }

  return {
    pickup: sanitizeString(pickup),
    rating: Number(rating),
    comment: comment ? sanitizeString(comment) : "",
    tags: Array.isArray(tags) ? tags : [],
  };
};
