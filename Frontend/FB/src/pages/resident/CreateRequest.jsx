import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaArrowLeft, FaWallet, FaMoneyBill } from "react-icons/fa";
import { toast } from "react-toastify";

import LocationPickerMap from "../../components/map/LocationPickerMap";

import { createPickupService } from "../../services/pickupService";
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
      navigate(ROUTES.RESIDENT_MY_REQUESTS);
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

  return (
    <div className="mx-auto max-w-xl animate-fade-in pt-2 sm:pt-4">
      <button
        onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
        className="group mb-6 flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 transition group-hover:bg-gray-200">
          <FaArrowLeft className="h-3 w-3" />
        </div>
        Back
      </button>

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

          <div>
            <LocationPickerMap onChange={handleLocationChange} />
            {errors.coordinates && <p className="mt-1 text-xs text-red-500">{errors.coordinates}</p>}
          </div>

          <div>
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

          <div>
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

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
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
    </div>
  );
};

export default CreateRequest;