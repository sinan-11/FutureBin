import { useEffect, useState, useCallback } from "react";
import {
  FaStar, FaTrash,
  FaArrowUp, FaArrowDown, FaFilter,
} from "react-icons/fa";
import { toast } from "react-toastify";

import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import StarRating from "../../components/StarRating";
import Loader from "../../components/Loader";
import {
  getAllAdminReviewsService,
  getAdminReviewStatsService,
  deleteAdminReviewService,
} from "../../services/reviewService";
import { getErrorMessage, formatDateTime, capitalize } from "../../utils/helpers";

const AdminReviews = () => {
  const [reviews, setReviews] = useState({ reviews: [], page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({ totalReviews: 0, platformAverage: 0, lowestRated: [], highestRatedCollectors: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ rating: "", role: "" });
  const [deleting, setDeleting] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        getAllAdminReviewsService(page, 20, filters),
        getAdminReviewStatsService(),
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    setDeleting(reviewId);
    try {
      await deleteAdminReviewService(reviewId);
      toast.success("Review deleted");
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (loading && page === 1) {
    return (
      <AdminLayout>
        <Loader />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl animate-fade-in pb-8">
        <PageHeader
          title="Reviews"
          subtitle="Manage platform reviews and ratings."
          icon={FaStar}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div className="card p-5">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Platform Average</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-surface-800">
                {stats.platformAverage > 0 ? stats.platformAverage.toFixed(1) : "—"}
              </span>
              <span className="text-sm text-surface-400">/ 5</span>
            </div>
            {stats.platformAverage > 0 && (
              <StarRating rating={stats.platformAverage} readonly size="sm" />
            )}
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Total Reviews</p>
            <p className="mt-2 text-3xl font-bold text-surface-800">{stats.totalReviews}</p>
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Reviews Shown</p>
            <p className="mt-2 text-3xl font-bold text-surface-800">{reviews.total}</p>
          </div>
        </div>

        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="h-4 w-4 text-surface-400" />
            <p className="text-sm font-semibold text-surface-600">Filters</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange("rating", e.target.value)}
              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-200 dark:bg-surface-100"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-surface-200 dark:bg-surface-100"
            >
              <option value="">All Roles</option>
              <option value="resident">Resident Reviews</option>
              <option value="collector">Collector Reviews</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {reviews.reviews.length > 0 ? (
            reviews.reviews.map((review) => (
              <div key={review._id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating rating={review.rating} readonly size="sm" />
                      <span className="text-xs text-surface-400">{formatDateTime(review.createdAt)}</span>
                      <span className="inline-flex items-center rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-500 dark:bg-surface-200/60">
                        {capitalize(review.reviewerRole)} → {capitalize(review.reviewee?.role || "")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span className="font-semibold text-surface-700">{review.reviewer?.name || "Unknown"}</span>
                      <span className="text-surface-300">→</span>
                      <span className="font-semibold text-surface-700">{review.reviewee?.name || "Unknown"}</span>
                    </div>
                    {review.pickup && (
                      <p className="text-xs text-surface-400 mb-1">
                        Pickup: {review.pickup.pickupAddress} · {capitalize(review.pickup.wasteType || "")}
                      </p>
                    )}
                    {review.tags && review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {review.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {review.comment && (
                      <p className="mt-2 text-sm text-surface-600 italic">&ldquo;{review.comment}&rdquo;</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(review._id)}
                    disabled={deleting === review._id}
                    className="ml-4 rounded-lg p-2 text-surface-300 transition hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-500/10 disabled:opacity-50"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-12 text-center">
              <FaStar className="mx-auto h-8 w-8 text-surface-300 mb-3" />
              <p className="text-sm text-surface-400">No reviews found.</p>
            </div>
          )}
        </div>

        {reviews.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-surface-500">
              Page {page} of {reviews.pages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= reviews.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {(stats.lowestRated.length > 0 || stats.highestRatedCollectors.length > 0) && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stats.lowestRated.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FaArrowDown className="h-4 w-4 text-danger-500" />
                  <h3 className="text-sm font-semibold text-surface-600">Lowest Rated Users</h3>
                </div>
                <div className="space-y-2">
                  {stats.lowestRated.map((user) => (
                    <div key={user._id} className="flex items-center justify-between rounded-lg bg-surface-50 p-3 dark:bg-surface-200/40">
                      <div>
                        <p className="text-sm font-medium text-surface-700">{user.name}</p>
                        <p className="text-xs text-surface-400">{capitalize(user.role)} · {user.count} reviews</p>
                      </div>
                      <StarRating rating={user.avgRating} readonly size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.highestRatedCollectors.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FaArrowUp className="h-4 w-4 text-success-500" />
                  <h3 className="text-sm font-semibold text-surface-600">Top Rated Collectors</h3>
                </div>
                <div className="space-y-2">
                  {stats.highestRatedCollectors.map((user) => (
                    <div key={user._id} className="flex items-center justify-between rounded-lg bg-surface-50 p-3 dark:bg-surface-200/40">
                      <div>
                        <p className="text-sm font-medium text-surface-700">{user.name}</p>
                        <p className="text-xs text-surface-400">{user.count} reviews</p>
                      </div>
                      <StarRating rating={user.avgRating} readonly size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
