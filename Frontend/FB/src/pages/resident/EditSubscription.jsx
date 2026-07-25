import { useState, useEffect } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { FaLeaf, FaSignOutAlt, FaArrowLeft, FaCalendarAlt, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import { editSubscriptionService } from "../../services/subscriptionService";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";
import LocationPickerMap from "../../components/map/LocationPickerMap";

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
    error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
  } px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100`;

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
      </div>
    );
  }

  if (!existing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Subscription not found. Go back and try again.</p>
      </div>
    );
  }

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
              to={ROUTES.RESIDENT_MY_SUBSCRIPTIONS}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaArrowLeft className="h-3.5 w-3.5" /> Back
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

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
            <FaCalendarAlt className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Subscription</h1>
            <p className="text-sm text-gray-400 capitalize">{existing.frequency} subscription</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Frequency */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Frequency</label>
            <div className="grid grid-cols-2 gap-3">
              {["weekly", "monthly"].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => handleChange("frequency", freq)}
                  className={`rounded-xl border-2 p-3 text-sm font-semibold capitalize transition ${
                    form.frequency === freq
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {form.frequency === "weekly" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Day of Week</label>
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.dayOfMonth}
                onChange={(e) => handleChange("dayOfMonth", e.target.value)}
                placeholder="1-31"
                className={inputClass(errors.dayOfMonth)}
              />
              {errors.dayOfMonth && <p className="mt-1 text-xs text-red-500">{errors.dayOfMonth}</p>}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Pickup Time</label>
            <input
              type="time"
              value={form.pickupTime}
              onChange={(e) => handleChange("pickupTime", e.target.value)}
              className={inputClass()}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Waste Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WASTE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange("wasteType", type)}
                  className={`rounded-xl border-2 p-2.5 text-xs font-semibold capitalize transition ${
                    form.wasteType === type
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Estimated Weight (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={form.estimatedWeight}
              onChange={(e) => handleChange("estimatedWeight", e.target.value)}
              placeholder="e.g. 5"
              className={inputClass(errors.estimatedWeight)}
            />
            {errors.estimatedWeight && <p className="mt-1 text-xs text-red-500">{errors.estimatedWeight}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Pickup Address</label>
            <input
              type="text"
              value={form.addressFull}
              onChange={(e) => handleChange("addressFull", e.target.value)}
              placeholder="Full address"
              className={inputClass(errors.addressFull)}
            />
            {errors.addressFull && <p className="mt-1 text-xs text-red-500">{errors.addressFull}</p>}
          </div>

          <div className="relative z-0">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Pickup Location</label>
            <p className="mb-1.5 text-xs text-gray-400">Tap the map or drag the marker</p>
            <LocationPickerMap onChange={handleLocationChange} />
            {errors.coordinates && <p className="mt-1 text-xs text-red-500">{errors.coordinates}</p>}
          </div>

          <div className="relative z-10">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {["wallet", "cash"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => handleChange("paymentMethod", method)}
                  className={`rounded-xl border-2 p-3 text-sm font-semibold capitalize transition ${
                    form.paymentMethod === method
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="relative z-10 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3.5 text-sm font-bold text-white shadow-sm shadow-brand-200 hover:from-brand-700 hover:to-brand-600 active:scale-[0.97] transition disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default EditSubscription;
