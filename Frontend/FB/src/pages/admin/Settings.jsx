import { useEffect, useState } from "react";
import { FaSave, FaUndo } from "react-icons/fa";
import { toast } from "react-toastify";

import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/Button";
import { getSettings, saveSettings } from "../../services/settingService";

const PRICE_KEYS = [
  { key: "price_recyclable", label: "Recyclable", color: "bg-blue-50 border-blue-200" },
  { key: "price_organic", label: "Organic", color: "bg-green-50 border-green-200" },
  { key: "price_hazardous", label: "Hazardous", color: "bg-red-50 border-red-200" },
  { key: "price_electronic", label: "Electronic", color: "bg-purple-50 border-purple-200" },
  { key: "price_general", label: "General", color: "bg-gray-50 border-gray-200" },
  { key: "pickup_price_per_kg", label: "Default Rate", color: "bg-yellow-50 border-yellow-200" },
];

const OTHER_KEYS = [
  { key: "pickup_search_radius", label: "Search Radius (m)" },
  { key: "pickup_expiry_minutes", label: "Expiry Minutes" },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      const map = {};
      data.forEach((s) => {
        map[s.key] = s.value;
      });
      setSettings(map);
      setOriginal(map);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    const num = Number(value);
    if (value === "" || !isNaN(num)) {
      setSettings((prev) => ({ ...prev, [key]: value === "" ? "" : num }));
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    try {
      const changed = {};
      for (const key of Object.keys(settings)) {
        if (settings[key] !== original[key]) {
          changed[key] = Number(settings[key]);
        }
      }

      if (Object.keys(changed).length === 0) {
        toast.info("No changes to save");
        return;
      }

      await saveSettings(changed);
      toast.success("Settings updated successfully");
      setOriginal({ ...settings });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...original });
    toast.info("Changes discarded");
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-400 border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Waste Prices */}
        <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-lg font-bold text-surface-800">Waste Prices (per kg)</h3>
          <p className="mb-6 text-sm text-surface-500">Set the price collectors earn per kilogram for each waste type.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {PRICE_KEYS.map(({ key, label, color }) => (
              <div key={key} className={`rounded-lg border p-4 ${color}`}>
                <label className="mb-2 block text-sm font-semibold text-surface-700">{label}</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-surface-600">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={settings[key] ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-lg font-semibold text-surface-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Other Settings */}
        <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-lg font-bold text-surface-800">Pickup Configuration</h3>
          <p className="mb-6 text-sm text-surface-500">General pickup request settings.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {OTHER_KEYS.map(({ key, label }) => (
              <div key={key} className="rounded-lg border border-surface-200 bg-surface-50 p-4">
                <label className="mb-2 block text-sm font-semibold text-surface-700">{label}</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-lg font-semibold text-surface-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={FaUndo}
            onClick={handleReset}
            disabled={!hasChanges || saving}
          >
            Discard
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={FaSave}
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
