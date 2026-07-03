import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaSignOutAlt, FaUserCheck, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import { logoutService } from "../../services/authService";
import { getUsersService } from "../../services/userService";
import { ROUTES } from "../../utils/constants";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const ApprovedCollectors = () => {
  const navigate = useNavigate();
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadCollectors() {
    try {
      const res = await getUsersService();
      const allUsers = res.data || [];
      setCollectors(allUsers.filter((u) => u.role === "collector" && u.isApproved));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setLoading(true); loadCollectors(); }, []);

  const handleLogout = async () => { await logoutService(); toast.success("Logged out"); navigate(ROUTES.LOGIN); };

  const filtered = collectors.filter(
    (c) => c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.collectorDetails?.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-white/10 bg-brand-700 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <h1 className="text-xl font-bold text-white md:text-3xl">Future Bin Admin</h1>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon={FaHome} onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)} />
            <Button variant="danger" size="sm" icon={FaSignOutAlt} onClick={handleLogout} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold text-brand-700 sm:text-4xl">
            <FaUserCheck className="mr-3 inline-block" /> Approved Collectors
          </h2>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Search by name, email, or vehicle..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-surface py-2 pl-10 pr-4 text-surface-800 outline-none transition-all duration-200 focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 md:w-72" />
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 bg-surface p-6 shadow-sm">
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent"></div></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-surface-400">
              <FaUserCheck className="text-4xl" />
              <p>{search ? "No approved collectors match your search" : "No approved collectors found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-surface-50">
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Name</th>
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Email</th>
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Phone</th>
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Vehicle</th>
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Status</th>
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Approved On</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((collector) => (
                    <tr key={collector._id} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="p-3 font-medium text-surface-800">{collector.name}</td>
                      <td className="p-3 text-surface-500">{collector.email}</td>
                      <td className="p-3 text-surface-500">{collector.collectorDetails?.phone || "N/A"}</td>
                      <td className="p-3 text-surface-500">{collector.collectorDetails?.vehicleNumber || "N/A"}</td>
                      <td className="p-3">
                        <span className={collector.isAvailable ? "font-semibold text-success" : "font-semibold text-surface-400"}>
                          {collector.isAvailable ? "Available" : "Offline"}
                        </span>
                      </td>
                      <td className="p-3 text-surface-500">{formatDate(collector.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ApprovedCollectors;
