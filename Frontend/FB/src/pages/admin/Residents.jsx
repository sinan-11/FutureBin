import { useEffect, useState } from "react";
import { FaUsers, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { ListSkeleton } from "../../components/Skeleton";
import AdminLayout from "../../layouts/AdminLayout";
import { getUsersService } from "../../services/userService";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadResidents() {
    try {
      const res = await getUsersService();
      const allUsers = res.data || [];
      setResidents(allUsers.filter((u) => u.role === "resident"));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setLoading(true); loadResidents(); }, []);

  const filtered = residents.filter(
    (r) => r.name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="animate-fade-in pb-8">
        <PageHeader
          title="Residents"
          subtitle="All registered residents in the community"
          icon={FaUsers}
          actions={
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400 dark:text-surface-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
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
              icon={FaUsers}
              title={search ? "No matching residents" : "No residents found"}
              description={search ? "Try a different name or email." : "Residents who sign up will appear here."}
            />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-surface-50">
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Name</th>
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Email</th>
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Joined</th>
                    <th className="p-3 text-left text-sm font-semibold text-surface-600">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((resident) => (
                    <tr key={resident._id} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="p-3 font-medium text-surface-800">{resident.name}</td>
                      <td className="p-3 text-surface-500">{resident.email}</td>
                      <td className="p-3 text-surface-500">{formatDate(resident.createdAt)}</td>
                      <td className="p-3">
                        <span className={resident.emailVerified ? "font-semibold text-success" : "font-semibold text-danger"}>
                          {resident.emailVerified ? "Verified" : "Not Verified"}
                        </span>
                      </td>
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

export default Residents;
