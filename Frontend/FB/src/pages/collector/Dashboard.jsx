import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaSignOutAlt, FaToggleOn, FaToggleOff,
  FaMapMarkerAlt, FaTrashAlt, FaUser, FaTruck,
  FaPhone, FaRegCalendarAlt, FaEnvelope, FaIdBadge,
  FaCheckCircle, FaTimesCircle, FaRoute,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import Card from "../../components/Card";
import useAuth from "../../hooks/useAuth";
import { logoutService } from "../../services/authService";
import { updateAvailabilityService, updateLocationService, getMeService } from "../../services/userService";
import { ROUTES } from "../../utils/constants";
import { getErrorMessage, formatDate } from "../../utils/helpers";

const Dashboard = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(user);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMsg, setLocationMsg] = useState("");

  async function loadProfile() {
    try {
      const res = await getMeService();
      setProfile(res.data);
      setIsAvailable(res.data.isAvailable);
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (accessToken) loadProfile();
  }, [accessToken]);

  const handleLogout = async () => {
    await logoutService();
    toast.success("Logged out successfully");
    navigate(ROUTES.LOGIN);
  };

  const handleToggleAvailability = async () => {
    setAvailabilityLoading(true);
    try {
      const newStatus = !isAvailable;
      const res = await updateAvailabilityService(newStatus);
      const updated = res.data;
      setIsAvailable(updated.isAvailable);
      setProfile(updated);
      toast.success(updated.isAvailable ? "You are now online" : "You are now offline");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocationLoading(true);
    setLocationMsg("Getting location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { longitude, latitude } = position.coords;
          const res = await updateLocationService(longitude, latitude);
          setProfile(res.data);
          setLocationMsg(`Location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast.success("Location updated successfully");
        } catch (error) {
          toast.error(getErrorMessage(error));
          setLocationMsg("");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setLocationMsg("");
        toast.error("Failed to get location. Please enable GPS.");
      }
    );
  };

  const p = profile || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-surface to-surface-50">
      <header className="bg-gradient-to-r from-brand-700 to-brand-500 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8 md:py-5">
          <h1 className="cursor-pointer text-xl font-bold tracking-tight text-white md:text-3xl" onClick={() => navigate(ROUTES.HOME)}>
            Future Bin
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={FaHome} onClick={() => navigate(ROUTES.HOME)}>Home</Button>
            <Button variant="danger" size="sm" icon={FaSignOutAlt} onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 p-6 text-white shadow-lg md:p-8">
          <h2 className="text-2xl font-bold md:text-4xl">Welcome, {p.name?.split(" ")[0] || "Collector"}!</h2>
          <p className="mt-2 text-brand-100">Manage your availability, location, and collection tasks.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <h3 className="mb-4 text-lg font-bold text-surface-800">Profile</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-surface-50 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                  {p.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "C"}
                </div>
                <div>
                  <p className="text-lg font-bold text-surface-800">{p.name}</p>
                  <p className="text-sm text-surface-400">Collector</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  <FaEnvelope className="h-4 w-4 text-surface-400" />
                  <div className="min-w-0">
                    <p className="text-xs text-surface-400">Email</p>
                    <p className="truncate text-sm font-medium text-surface-700">{p.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  <FaIdBadge className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-400">Role</p>
                    <p className="text-sm font-medium capitalize text-surface-700">{p.role || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  <FaPhone className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-400">Phone</p>
                    <p className="text-sm font-medium text-surface-700">{p.collectorDetails?.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  <FaTruck className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-400">Vehicle</p>
                    <p className="text-sm font-medium text-surface-700">{p.collectorDetails?.vehicleNumber || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  {p.emailVerified ? <FaCheckCircle className="h-4 w-4 text-green-500" /> : <FaTimesCircle className="h-4 w-4 text-red-500" />}
                  <div>
                    <p className="text-xs text-surface-400">Email Verified</p>
                    <p className={`text-sm font-medium ${p.emailVerified ? "text-green-600" : "text-red-600"}`}>
                      {p.emailVerified ? "Verified" : "Not Verified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-surface-200 p-3">
                  <FaRegCalendarAlt className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-400">Member Since</p>
                    <p className="text-sm font-medium text-surface-700">{p.createdAt ? formatDate(p.createdAt) : "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-surface-800">Availability</h3>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isAvailable ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-green-500" : "bg-red-500"}`} />
                  {isAvailable ? "Online" : "Offline"}
                </span>
              </div>
              <p className="mt-2 text-sm text-surface-500">Toggle your status to accept collection requests.</p>
              <Button
                className="mt-4 w-full"
                variant={isAvailable ? "danger" : "primary"}
                icon={isAvailable ? FaToggleOff : FaToggleOn}
                onClick={handleToggleAvailability}
                disabled={availabilityLoading}
              >
                {availabilityLoading ? "Updating..." : isAvailable ? "Go Offline" : "Go Online"}
              </Button>
            </Card>

            <Card>
              <h3 className="mb-3 text-lg font-bold text-surface-800">Location</h3>
              <p className="mb-3 text-sm text-surface-500">Update your GPS location for nearby requests.</p>
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-surface-50 p-3 text-sm">
                <FaMapMarkerAlt className="h-4 w-4 flex-shrink-0 text-brand-500" />
                <span className="text-surface-500">
                  {p.location?.coordinates
                    ? `${p.location.coordinates[1].toFixed(4)}, ${p.location.coordinates[0].toFixed(4)}`
                    : locationMsg || "No location set"}
                </span>
              </div>
              <Button className="w-full" variant="secondary" icon={FaMapMarkerAlt} onClick={handleUpdateLocation} disabled={locationLoading}>
                {locationLoading ? "Updating..." : "Update Location"}
              </Button>
            </Card>
          </div>
        </div>

        <Card>
          <h3 className="mb-4 text-lg font-bold text-surface-800">Assigned Collections</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
              <FaRoute className="h-7 w-7 text-surface-300" />
            </div>
            <p className="text-lg font-semibold text-surface-500">No collections assigned</p>
            <p className="mt-1 max-w-sm text-sm text-surface-400">
              {isAvailable
                ? "You are online. Collection requests will appear here when assigned."
                : "Go online to start receiving collection requests."}
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
