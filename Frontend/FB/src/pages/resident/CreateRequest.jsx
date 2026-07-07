import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRecycle, FaWeight, FaMapMarkerAlt, FaCalendarAlt, FaTrashAlt, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Select from "../../components/Select";

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
  });

  const [errors, setErrors] = useState({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setForm((prev) => ({ ...prev, coordinates: [longitude, latitude] }));
        setLocationLoading(false);
        toast.success("Location captured");
      },
      () => {
        setLocationLoading(false);
        toast.error("Failed to get location. Enable GPS and try again.");
      }
    );
  };

  const validate = () => {
    const errs = {};
    if (!form.wasteType) errs.wasteType = "Select waste type";
    if (!form.estimatedWeight || Number(form.estimatedWeight) <= 0) errs.estimatedWeight = "Weight must be greater than 0";
    if (!form.pickupAddress.trim()) errs.pickupAddress = "Address is required";
    if (!form.coordinates) errs.coordinates = "Get your location first";
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
      });
      toast.success("Pickup request created! Nearby collectors have been notified.");
      navigate(ROUTES.RESIDENT_MY_REQUESTS);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <button
        onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-800"
      >
        <FaArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Request a Pickup</h2>
        <p className="mt-1 text-sm text-gray-400">Fill in the details to schedule a waste collection.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-1">
          <Select
            label="Waste Type"
            name="wasteType"
            value={form.wasteType}
            onChange={handleChange}
            options={WASTE_TYPES}
            placeholder="Select waste type"
            error={errors.wasteType}
          />

          <Input
            label="Estimated Weight (kg)"
            name="estimatedWeight"
            type="number"
            step="0.1"
            min="0.1"
            placeholder="e.g. 5"
            value={form.estimatedWeight}
            onChange={handleChange}
            icon={FaWeight}
            error={errors.estimatedWeight}
          />

          <Input
            label="Pickup Address"
            name="pickupAddress"
            placeholder="Full address for pickup"
            value={form.pickupAddress}
            onChange={handleChange}
            icon={FaMapMarkerAlt}
            error={errors.pickupAddress}
          />

          <Input
            label="Scheduled Date & Time (optional)"
            name="scheduledAt"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={handleChange}
            icon={FaCalendarAlt}
          />

          <div className="mb-4">
            <label className="mb-2 block font-medium text-gray-700 text-sm">Pickup Location</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locationLoading}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  form.coordinates
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                <FaMapMarkerAlt className={locationLoading ? "animate-pulse" : ""} />
                {locationLoading ? "Getting..." : form.coordinates ? "Location Set" : "Get Current Location"}
              </button>
              {form.coordinates && (
                <span className="text-xs text-gray-400">
                  {form.coordinates[1].toFixed(4)}, {form.coordinates[0].toFixed(4)}
                </span>
              )}
            </div>
            {errors.coordinates && <p className="mt-1 text-sm text-red-500">{errors.coordinates}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Any special instructions for the collector..."
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.97] disabled:opacity-50"
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
            <button
              type="button"
              onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
