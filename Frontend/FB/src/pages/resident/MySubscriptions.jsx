import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaLeaf, FaHome, FaSignOutAlt, FaPlus, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import { getMySubscriptionsService, pauseSubscriptionService, resumeSubscriptionService, cancelSubscriptionService, deleteSubscriptionService } from "../../services/subscriptionService";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";
import SubscriptionCard from "../../components/SubscriptionCard";

const MySubscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMySubscriptionsService();
      setSubscriptions(data);
    } catch {
      // error handled by service
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handlePause = async (id) => {
    try {
      await pauseSubscriptionService(id);
      toast.success("Subscription paused");
      loadSubscriptions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleResume = async (id) => {
    try {
      await resumeSubscriptionService(id);
      toast.success("Subscription resumed");
      loadSubscriptions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this subscription?")) return;
    try {
      await cancelSubscriptionService(id);
      toast.success("Subscription cancelled");
      loadSubscriptions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this subscription?")) return;
    try {
      await deleteSubscriptionService(id);
      toast.success("Subscription deleted");
      loadSubscriptions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = (subscription) => {
    navigate(ROUTES.RESIDENT_EDIT_SUBSCRIPTION.replace(":id", subscription._id), {
      state: { subscription },
    });
  };

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out");
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-700/95 shadow-lg shadow-brand-900/20 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 transition group-hover:bg-white/25 group-hover:scale-105">
              <FaLeaf className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white md:text-2xl">
              Future<span className="text-brand-200">Bin</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Link
              to={ROUTES.RESIDENT_DASHBOARD}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaHome className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full p-2 text-white/50 transition hover:bg-red-500/20 hover:text-red-300"
              title="Logout"
            >
              <FaSignOutAlt size={14} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">My Subscriptions</h1>
          <Link
            to={ROUTES.RESIDENT_CREATE_SUBSCRIPTION}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-200 hover:from-brand-700 hover:to-brand-600 active:scale-[0.97] transition"
          >
            <FaPlus className="h-3.5 w-3.5" /> New
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
              <FaCalendarAlt className="h-6 w-6 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No subscriptions yet</p>
            <p className="text-sm text-gray-400 mt-1">Create a subscription to automate your waste pickups.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <SubscriptionCard
                key={sub._id}
                subscription={sub}
                onEdit={handleEdit}
                onPause={handlePause}
                onResume={handleResume}
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MySubscriptions;
