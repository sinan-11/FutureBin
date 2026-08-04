import { useEffect, useState } from "react";
import { FaUserCheck, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { ListSkeleton } from "../../components/Skeleton";
import AdminLayout from "../../layouts/AdminLayout";
import { getUsersService } from "../../services/userService";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const ApprovedCollectors = () => {
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

  const filtered = collectors.filter(
    (c) => c.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.collectorDetails?.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="animate-fade-in pb-8">
        <PageHeader
          title="Approved Collectors"
          subtitle="Collectors approved to handle waste pickups"
          icon={FaUserCheck}
          actions={
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
              <input
                type="text"
                placeholder="Search by name, email, or vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-surface-200 bg-surface py-2 pl-9 pr-4 text-sm text-surface-800 outline-none transition-all duration-200 focus:ring-2 focus:ring-brand-500/15 dark:border-surface-200 dark:bg-surface-100 dark:text-surface-800 dark:placeholder:text-surface-500 md:w-72"
              />
            </div>
          }
        />

        <div className="card p-4 sm:p-6">
          {loading ? (
            <ListSkeleton count={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FaUserCheck}
              title={search ? "No matching collectors" : "No approved collectors"}
              description={search ? "Try a different search term." : "Approved collectors will appear here."}
            />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
      </div>
    </AdminLayout>
  );
};

export default ApprovedCollectors;
