import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaHome, FaSignOutAlt, FaUsers, FaSearch, FaLeaf } from "react-icons/fa";
import { toast } from "react-toastify";

import Button from "../../components/Button";
import { logoutService } from "../../services/authService";
import { getUsersService } from "../../services/userService";
import { ROUTES } from "../../utils/constants";
import { formatDate, getErrorMessage } from "../../utils/helpers";

const Residents = () => {
  const navigate = useNavigate();
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

  const handleLogout = async () => { await logoutService(); toast.success("Logged out"); navigate(ROUTES.LOGIN); };

  const filtered = residents.filter(
    (r) => r.name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-brand-700/95 shadow-lg shadow-brand-900/20 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
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
              to={ROUTES.HOME}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaHome className="h-3.5 w-3.5" />
              Home
            </Link>
            <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
              Admin
            </div>
            <button
              onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FaHome className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
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

      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-bold text-brand-700 sm:text-4xl">
            <FaUsers className="mr-3 inline-block" /> Residents
          </h2>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-surface py-2 pl-10 pr-4 text-surface-800 outline-none transition-all duration-200 focus:ring-2 focus:ring-brand-300 focus:ring-offset-2 md:w-72" />
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 bg-surface p-4 shadow-sm sm:p-6">
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent"></div></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-surface-400">
              <FaUsers className="text-4xl" />
              <p>{search ? "No residents match your search" : "No residents found"}</p>
            </div>
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
      </main>
    </div>
  );
};

export default Residents;
