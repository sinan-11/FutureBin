import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import { editSubscriptionService } from "../../services/subscriptionService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";
import LocationPickerMap from "../../components/map/LocationPickerMap";
import ResidentLayout from "../../layouts/ResidentLayout";
import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";

const WASTE_TYPES = ["recyclable", "organic", "hazardous", "electronic", "general"];
const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const inputClass = (error) =>
  `w-full rounded-xl border ${
    error ? "border-danger-400 bg-danger-50/40 dark:bg-danger-500/10" : "border-surface-200 bg-surface dark:bg-surface-100 dark:border-surface-200"
  } px-4 py-3 text-sm text-surface-800 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-500/15`;

const EditSubscription = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const existing = location.state?.subscription;

  const [form, setForm] = useState({
    frequency: "weekly",
    dayOfWeek: 1,
    dayOfMonth: "",
    pickupTime: "09:00",
    wasteType: "general",
    estimatedWeight: "",
    addressFull: "",
    coordinates: null,
    paymentMethod: "wallet",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existing) {
      const coords = existing.location?.coordinates;
      setForm({
        frequency: existing.frequency || "weekly",
        dayOfWeek: existing.dayOfWeek ?? 1,
        dayOfMonth: existing.dayOfMonth ?? "",
        pickupTime: existing.pickupTime || "09:00",
        wasteType: existing.wasteType || "general",
        estimatedWeight: existing.estimatedWeight || "",
        addressFull: existing.address?.full || "",
        coordinates: coords && coords.length === 2 ? coords : null,
        paymentMethod: existing.paymentMethod || "wallet",
      });
    }
    setLoading(false);
  }, [existing]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.estimatedWeight || Number(form.estimatedWeight) <= 0) errs.estimatedWeight = "Weight must be > 0";
    if (!form.addressFull) errs.addressFull = "Address is required";
    if (!form.coordinates) errs.coordinates = "Please select a pickup location on the map";
    if (form.frequency === "monthly" && (!form.dayOfMonth || Number(form.dayOfMonth) < 1 || Number(form.dayOfMonth) > 31)) {
      errs.dayOfMonth = "Day of month must be 1-31";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        frequency: form.frequency,
        pickupTime: form.pickupTime,
        wasteType: form.wasteType,
        estimatedWeight: Number(form.estimatedWeight),
        address: {
          full: form.addressFull,
        },
        location: {
          type: "Point",
          coordinates: form.coordinates,
        },
        paymentMethod: form.paymentMethod,
      };

      if (form.frequency === "weekly") {
        payload.dayOfWeek = Number(form.dayOfWeek);
        payload.dayOfMonth = null;
      } else {
        payload.dayOfMonth = Number(form.dayOfMonth);
        payload.dayOfWeek = null;
      }

      await editSubscriptionService(id, payload);
      toast.success("Subscription updated!");
      navigate(ROUTES.RESIDENT_MY_SUBSCRIPTIONS, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out");
    navigate(ROUTES.HOME, { replace: true });
  };

  const handleLocationChange = ({ coordinates, address }) => {
    setForm((prev) => ({
      ...prev,
      coordinates,
      addressFull: address || prev.addressFull,
    }));
    setErrors((prev) => ({ ...prev, coordinates: "" }));
  };

  if (loading) {
    return (
      <ResidentLayout userName={user?.name}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
        </div>
      </ResidentLayout>
    );
  }

  if (!existing) {
    return (
      <ResidentLayout userName={user?.name}>
        <div className="card flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-surface-500 dark:text-surface-400">Subscription not found. Go back and try again.</p>
          <Button variant="secondary" onClick={() => navigate(ROUTES.RESIDENT_MY_SUBSCRIPTIONS)}>
            Back to Subscriptions
          </Button>
        </div>
      </ResidentLayout>
    );
  }

  return (
    <ResidentLayout userName={user?.name}>
      <div className="mx-auto max-w-2xl animate-fade-in">
        <PageHeader
          title="Edit Subscription"
          subtitle={`${existing.frequency} subscription`}
          icon={FaCalendarAlt}
        />

        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          {/* Frequency */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Frequency</label>
            <div className="grid grid-cols-2 gap-3">
              {["weekly", "monthly"].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => handleChange("frequency", freq)}
                  className={`rounded-xl border-2 p-3 text-sm font-semibold capitalize transition ${
                    form.frequency === freq
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-surface-200 text-surface-500 hover:border-surface-300 dark:border-surface-200 dark:text-surface-400"
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {form.frequency === "weekly" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Day of Week</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => handleChange("dayOfWeek", e.target.value)}
                className={inputClass()}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {form.frequency === "monthly" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.dayOfMonth}
                onChange={(e) => handleChange("dayOfMonth", e.target.value)}
                placeholder="1-31"
                className={inputClass(errors.dayOfMonth)}
              />
              {errors.dayOfMonth && <p className="mt-1 text-xs text-danger-500">{errors.dayOfMonth}</p>}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Pickup Time</label>
            <input
              type="time"
              value={form.pickupTime}
              onChange={(e) => handleChange("pickupTime", e.target.value)}
              className={inputClass()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Waste Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WASTE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange("wasteType", type)}
                  className={`rounded-xl border-2 p-2.5 text-xs font-semibold capitalize transition ${
                    form.wasteType === type
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-surface-200 text-surface-500 hover:border-surface-300 dark:border-surface-200 dark:text-surface-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Estimated Weight (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.estimatedWeight}
              onChange={(e) => handleChange("estimatedWeight", e.target.value)}
              placeholder="e.g. 5"
              className={inputClass(errors.estimatedWeight)}
            />
            {errors.estimatedWeight && <p className="mt-1 text-xs text-danger-500">{errors.estimatedWeight}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Pickup Address</label>
            <input
              type="text"
              value={form.addressFull}
              onChange={(e) => handleChange("addressFull", e.target.value)}
              placeholder="Full address"
              className={inputClass(errors.addressFull)}
            />
            {errors.addressFull && <p className="mt-1 text-xs text-danger-500">{errors.addressFull}</p>}
          </div>

          <div className="relative z-0">
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Pickup Location</label>
            <p className="mb-1.5 text-xs text-surface-400 dark:text-surface-500">Tap the map or drag the marker</p>
            <LocationPickerMap onChange={handleLocationChange} />
            {errors.coordinates && <p className="mt-1 text-xs text-danger-500">{errors.coordinates}</p>}
          </div>

          <div className="relative z-10">
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {["wallet", "cash"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleChange("paymentMethod", method)}
                  className={`rounded-xl border-2 p-3 text-sm font-semibold capitalize transition ${
                    form.paymentMethod === method
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-surface-200 text-surface-500 hover:border-surface-300 dark:border-surface-200 dark:text-surface-400"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            fullWidth
            size="xl"
            className="relative z-10"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </ResidentLayout>
  );
};

export default EditSubscription;
