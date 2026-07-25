import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaTrashAlt, FaWallet, FaMoneyBill, FaLeaf, FaHome, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import LocationPickerMap from "../../components/map/LocationPickerMap";

import { createPickupService } from "../../services/pickupService";
import { logoutService } from "../../services/authService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";

const WASTE_TYPES = [
  { value: "recyclable", label: "Recyclable" },
  { value: "organic", label: "Organic" },
  { value: "hazardous", label: "Hazardous" },
  { value: "electronic", label: "Electronic" },
  { value: "general", label: "General" },
];

const CreateRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    wasteType: "",
    estimatedWeight: "",
    pickupAddress: "",
    description: "",
    scheduledAt: "",
    coordinates: null,
    paymentMethod: "wallet",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleLocationChange = ({ coordinates, address }) => {
    setForm((prev) => ({
      ...prev,
      coordinates,
      pickupAddress: address || prev.pickupAddress,
    }));
    setErrors((prev) => ({ ...prev, coordinates: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.wasteType) errs.wasteType = "Select waste type";
    if (!form.estimatedWeight || Number(form.estimatedWeight) <= 0) errs.estimatedWeight = "Weight must be greater than 0";
    if (!form.pickupAddress.trim()) errs.pickupAddress = "Address is required";
    if (!form.coordinates) errs.coordinates = "Please select a pickup location on the map";
    if (form.scheduledAt && new Date(form.scheduledAt) <= new Date()) {
      errs.scheduledAt = "Scheduled time must be in the future";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createPickupService({
        wasteType: form.wasteType,
        estimatedWeight: Number(form.estimatedWeight),
        pickupAddress: form.pickupAddress,
        coordinates: form.coordinates,
        description: form.description,
        scheduledAt: form.scheduledAt || undefined,
        paymentMethod: form.paymentMethod,
      });
      toast.success("Pickup request created! Nearby collectors have been notified.");
      navigate(ROUTES.RESIDENT_DASHBOARD);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (error) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-all duration-200 ${
      error
        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
    }`;

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

      <main className="mx-auto max-w-xl px-4 py-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Request a Pickup</h1>
        <p className="mt-1 text-sm text-gray-400">Fill in the details to schedule a waste collection.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Pickup Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Waste Type</label>
              <select
                name="wasteType"
                value={form.wasteType}
                onChange={handleChange}
                className={inputClass(errors.wasteType)}
              >
                <option value="" disabled>Select waste type</option>
                {WASTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.wasteType && <p className="mt-1 text-xs text-red-500">{errors.wasteType}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Est. Weight (kg)</label>
              <input
                type="number"
                name="estimatedWeight"
                step="0.1"
                min="0.1"
                placeholder="e.g. 5"
                value={form.estimatedWeight}
                onChange={handleChange}
                className={inputClass(errors.estimatedWeight)}
              />
              {errors.estimatedWeight && <p className="mt-1 text-xs text-red-500">{errors.estimatedWeight}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Pickup Address</label>
            <input
              type="text"
              name="pickupAddress"
              placeholder="Full address for pickup"
              value={form.pickupAddress}
              onChange={handleChange}
              className={inputClass(errors.pickupAddress)}
            />
            {errors.pickupAddress && <p className="mt-1 text-xs text-red-500">{errors.pickupAddress}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Scheduled Date & Time</label>
              <p className="mb-1.5 text-xs text-gray-400">Optional — leave blank for ASAP</p>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
                min={minDateTime}
                className={inputClass(errors.scheduledAt)}
              />
              {errors.scheduledAt && <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Pickup Location</label>
              <p className="mb-1.5 text-xs text-gray-400">Tap the map or drag the marker</p>
            </div>
          </div>

          <div className="relative z-0">
            <LocationPickerMap onChange={handleLocationChange} />
            {errors.coordinates && <p className="mt-1 text-xs text-red-500">{errors.coordinates}</p>}
          </div>

          <div className="relative z-10">
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <p className="mb-1.5 text-xs text-gray-400">Optional — special instructions for the collector</p>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="e.g. Leave bins at the gate, door code is #1234..."
              value={form.description}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          <div className="relative z-10">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Payment Method</label>
            <p className="mb-1.5 text-xs text-gray-400">How would you like to pay?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "wallet" }))}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  form.paymentMethod === "wallet"
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  form.paymentMethod === "wallet" ? "bg-brand-100" : "bg-gray-100"
                }`}>
                  <FaWallet className={`h-5 w-5 ${
                    form.paymentMethod === "wallet" ? "text-brand-600" : "text-gray-400"
                  }`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${
                    form.paymentMethod === "wallet" ? "text-brand-700" : "text-gray-700"
                  }`}>Wallet</p>
                  <p className="text-xs text-gray-400">Pay from balance</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "cash" }))}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  form.paymentMethod === "cash"
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  form.paymentMethod === "cash" ? "bg-brand-100" : "bg-gray-100"
                }`}>
                  <FaMoneyBill className={`h-5 w-5 ${
                    form.paymentMethod === "cash" ? "text-brand-600" : "text-gray-400"
                  }`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${
                    form.paymentMethod === "cash" ? "text-brand-700" : "text-gray-700"
                  }`}>Cash</p>
                  <p className="text-xs text-gray-400">Pay at pickup</p>
                </div>
              </button>
            </div>
          </div>

          <div className="relative z-10 flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-200 transition hover:from-brand-700 hover:to-brand-600 hover:shadow-md hover:shadow-brand-300 active:scale-[0.97] disabled:opacity-50"
            >
              {submitting ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <FaTrashAlt className="h-4 w-4" />
              )}
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
      </main>
    </div>
  );
};

export default CreateRequest;