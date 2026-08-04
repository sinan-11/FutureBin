import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import { getMySubscriptionsService, pauseSubscriptionService, resumeSubscriptionService, cancelSubscriptionService, deleteSubscriptionService } from "../../services/subscriptionService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";
import SubscriptionCard from "../../components/SubscriptionCard";
import ResidentLayout from "../../layouts/ResidentLayout";
import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { ListSkeleton } from "../../components/Skeleton";

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

  return (
    <ResidentLayout userName={user?.name}>
      <div className="space-y-6">
        <PageHeader
          title="My Subscriptions"
          subtitle="Automate recurring waste pickups"
          icon={FaCalendarAlt}
          actions={
            <Button
              variant="primary"
              icon={FaPlus}
              onClick={() => navigate(ROUTES.RESIDENT_CREATE_SUBSCRIPTION)}
            >
              New
            </Button>
          }
        />

        {loading ? (
          <ListSkeleton count={2} />
        ) : subscriptions.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={FaCalendarAlt}
              title="No subscriptions yet"
              description="Create a subscription to automate your waste pickups."
              action={
                <Button
                  variant="primary"
                  icon={FaPlus}
                  onClick={() => navigate(ROUTES.RESIDENT_CREATE_SUBSCRIPTION)}
                >
                  Create Subscription
                </Button>
              }
            />
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
      </div>
    </ResidentLayout>
  );
};

export default MySubscriptions;
