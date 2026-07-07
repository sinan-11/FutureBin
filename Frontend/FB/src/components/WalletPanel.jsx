import { useState, useEffect } from "react";
import { FaWallet, FaTimes, FaMoneyBillWave, FaHistory, FaExchangeAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import Loader from "./Loader";
import { getWalletService, createWalletService } from "../services/walletService";
import { formatDateTime } from "../utils/helpers";

const WalletPanel = ({ onClose }) => {
  const [wallet, setWallet] = useState(null);
  const [hasWallet, setHasWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getWalletService();
      setHasWallet(data.hasWallet);
      if (data.hasWallet) setWallet(data.wallet);
    } catch {
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createWalletService();
      toast.success("Wallet created");
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-16">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4">
        <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
          <FaTimes />
        </button>

        {loading ? (
          <Loader fullScreen={false} />
        ) : !hasWallet ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
              <FaWallet className="h-7 w-7 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Create Your Wallet</h2>
            <p className="mt-2 text-sm text-gray-400">A wallet is needed for payments, refunds, and earnings.</p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="mt-6 w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Wallet"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Balance</p>
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs">{wallet.currency}</span>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {wallet.balance.toLocaleString("en-IN", { style: "currency", currency: wallet.currency, minimumFractionDigits: 2 })}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3 text-sm">
                <span className="text-white/70">ID: {wallet._id.slice(-8).toUpperCase()}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${wallet.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${wallet.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  {wallet.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-400">Created</span>
              <span className="font-medium text-gray-700">{formatDateTime(wallet.createdAt)}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Actions</h3>
              {[{ icon: FaMoneyBillWave, label: "Add Money" }, { icon: FaExchangeAlt, label: "Withdraw" }, { icon: FaHistory, label: "Transaction History" }].map((item, i) => (
                <div key={i} className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3 opacity-60">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <item.icon className="h-4 w-4 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-300">Coming soon</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPanel;
