import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaWallet, FaMoneyBill, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";

import useAuth from "../../hooks/useAuth";
import LocationPickerMap from "../../components/map/LocationPickerMap";
import Button from "../../components/Button";
import PageHeader from "../../components/PageHeader";
import ResidentLayout from "../../layouts/ResidentLayout";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    wasteType: "",
    estimatedWeight: "",
    pickupAddress: "",
    description: "",
    coordinates: null,
    paymentMethod: "wallet",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
    `w-full rounded-xl border bg-surface px-4 py-3 text-sm outline-none transition-all duration-200 dark:bg-surface-100 ${
      error
        ? "border-danger-300 focus:border-danger-400 focus:ring-2 focus:ring-danger-100 dark:focus:ring-danger-500/20"
        : "border-surface-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-surface-200 dark:focus:ring-brand-500/15"
    }`;

  return (
    <ResidentLayout userName={user?.name}>
      <div className="mx-auto max-w-xl animate-fade-in">
        <PageHeader
          title="Request a Pickup"
          subtitle="Fill in the details to schedule a waste collection."
          icon={FaPlus}
        />

        <div className="card overflow-hidden">
          <div className="border-b border-surface-100 bg-surface-50/60 px-6 py-4 dark:border-surface-200/60">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400">
              Pickup Details
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Waste Type</label>
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
                {errors.wasteType && <p className="mt-1 text-xs text-danger-500">{errors.wasteType}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Est. Weight (kg)</label>
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
                {errors.estimatedWeight && <p className="mt-1 text-xs text-danger-500">{errors.estimatedWeight}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Pickup Address</label>
              <input
                type="text"
                name="pickupAddress"
                placeholder="Full address for pickup"
                value={form.pickupAddress}
                onChange={handleChange}
                className={inputClass(errors.pickupAddress)}
              />
              {errors.pickupAddress && <p className="mt-1 text-xs text-danger-500">{errors.pickupAddress}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Pickup Location</label>
                <p className="mb-1.5 text-xs text-surface-400 dark:text-surface-500">Tap the map or drag the marker</p>
              </div>
            </div>

            <div className="relative z-0">
              <LocationPickerMap onChange={handleLocationChange} />
              {errors.coordinates && <p className="mt-1 text-xs text-danger-500">{errors.coordinates}</p>}
            </div>

            <div className="relative z-10">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Description</label>
              <p className="mb-1.5 text-xs text-surface-400 dark:text-surface-500">Optional — special instructions for the collector</p>
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
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">Payment Method</label>
              <p className="mb-1.5 text-xs text-surface-400 dark:text-surface-500">How would you like to pay?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "wallet" }))}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                    form.paymentMethod === "wallet"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-surface-200 bg-surface hover:border-surface-300 dark:border-surface-200"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    form.paymentMethod === "wallet" ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-surface-100 dark:bg-surface-200"
                  }`}>
                    <FaWallet className={`h-5 w-5 ${
                      form.paymentMethod === "wallet" ? "text-emerald-600 dark:text-emerald-400" : "text-surface-400"
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${
                      form.paymentMethod === "wallet" ? "text-emerald-700 dark:text-emerald-300" : "text-surface-700 dark:text-surface-300"
                    }`}>Wallet</p>
                    <p className="text-xs text-surface-400">Pay from balance</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "cash" }))}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                    form.paymentMethod === "cash"
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                      : "border-surface-200 bg-surface hover:border-surface-300 dark:border-surface-200"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    form.paymentMethod === "cash" ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-surface-100 dark:bg-surface-200"
                  }`}>
                    <FaMoneyBill className={`h-5 w-5 ${
                      form.paymentMethod === "cash" ? "text-emerald-600 dark:text-emerald-400" : "text-surface-400"
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${
                      form.paymentMethod === "cash" ? "text-emerald-700 dark:text-emerald-300" : "text-surface-700 dark:text-surface-300"
                    }`}>Cash</p>
                    <p className="text-xs text-surface-400">Pay at pickup</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="relative z-10 flex flex-col-reverse gap-3 pt-4 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(ROUTES.RESIDENT_DASHBOARD)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                icon={FaTrashAlt}
                className="flex-1"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ResidentLayout>
  );
};

export default CreateRequest;