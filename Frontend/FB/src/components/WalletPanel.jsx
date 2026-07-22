import { useState, useEffect } from "react";
import { FaWallet, FaTimes, FaMoneyBillWave, FaHistory, FaArrowDown, FaArrowUp, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import Loader from "./Loader";
import { getWalletService, createWalletService, getTransactionsService } from "../services/walletService";
import { createOrder, verifyPayment } from "../api/paymentApi";
import { formatDateTime, formatCurrency } from "../utils/helpers";

const TRANSACTION_TYPES = {
  TOPUP: { label: "Top-up", color: "text-green-600", icon: FaArrowDown },
  RESERVE: { label: "Reserved", color: "text-orange-500", icon: FaArrowUp },
  EXTRA_RESERVE: { label: "Extra Reserved", color: "text-orange-500", icon: FaArrowUp },
  RELEASE: { label: "Released", color: "text-blue-500", icon: FaArrowDown },
  PICKUP_PAYMENT: { label: "Pickup Payment", color: "text-green-600", icon: FaArrowDown },
  CANCELLATION_FEE: { label: "Cancellation Fee", color: "text-red-500", icon: FaArrowUp },
  TRANSFER: { label: "Transfer", color: "text-purple-500", icon: FaArrowUp },
  WITHDRAWAL: { label: "Withdrawal", color: "text-red-500", icon: FaArrowUp },
  REFUND: { label: "Refund", color: "text-green-500", icon: FaArrowDown },
};

const WalletPanel = ({ onClose }) => {
  const [wallet, setWallet] = useState(null);
  const [hasWallet, setHasWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

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

  const loadTransactions = async () => {
    setLoadingTx(true);
    try {
      const txs = await getTransactionsService();
      setTransactions(txs);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (showTransactions) loadTransactions();
  }, [showTransactions]);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setToppingUp(true);
    try {
      const orderRes = await createOrder(amount);
      const { order, key } = orderRes.data;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Future Bin",
        description: "Wallet Top-up",
        order_id: order.id,
        handler: async (response) => {
          try {
            const res = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(res?.data?.message || "Wallet topped up successfully");
            setShowTopUp(false);
            setTopUpAmount("");
            await load();
          } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Payment verification failed";
            toast.error(msg);
          }
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#16a34a" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create order";
      toast.error(msg);
    } finally {
      setToppingUp(false);
    }
  };

  const availableBalance = wallet ? wallet.balance - (wallet.heldBalance || 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-16">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4 max-h-[80vh] overflow-y-auto">
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
            {/* Balance Card */}
            <div className="rounded-xl bg-brand-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Total Balance</p>
                <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs">{wallet.currency}</span>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {formatCurrency(wallet.balance, wallet.currency)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/20 pt-3">
                <div>
                  <p className="text-xs text-white/60">Held</p>
                  <p className="text-sm font-semibold">{formatCurrency(wallet.heldBalance || 0, wallet.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Available</p>
                  <p className="text-sm font-semibold">{formatCurrency(availableBalance, wallet.currency)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3 text-sm">
                <span className="text-white/70">ID: {wallet._id.slice(-8).toUpperCase()}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${wallet.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${wallet.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  {wallet.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Actions</h3>

              {/* Add Money */}
              <button
                onClick={() => { setShowTopUp(true); setShowTransactions(false); }}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <FaMoneyBillWave className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-700 text-sm">Add Money</p>
                  <p className="text-xs text-gray-400">Top up via Razorpay</p>
                </div>
              </button>

              {/* Transaction History */}
              <button
                onClick={() => { setShowTransactions(true); setShowTopUp(false); }}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <FaHistory className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-700 text-sm">Transaction History</p>
                  <p className="text-xs text-gray-400">View all transactions</p>
                </div>
              </button>
            </div>

            {/* Top-up Section */}
            {showTopUp && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                <h4 className="text-sm font-bold text-green-800">Add Money to Wallet</h4>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter amount (₹)"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  {[100, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTopUpAmount(String(amt))}
                      className="flex-1 rounded-lg border border-green-200 bg-white py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleTopUp}
                  disabled={toppingUp || !topUpAmount}
                  className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {toppingUp ? <><FaSpinner className="animate-spin" /> Processing...</> : "Pay with Razorpay"}
                </button>
              </div>
            )}

            {/* Transactions Section */}
            {showTransactions && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <h4 className="text-sm font-bold text-gray-700">Transactions</h4>
                {loadingTx ? (
                  <div className="flex justify-center py-4"><FaSpinner className="animate-spin text-gray-400" /></div>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {transactions.map((tx) => {
                      const typeInfo = TRANSACTION_TYPES[tx.type] || { label: tx.type, color: "text-gray-500", icon: FaArrowUp };
                      const Icon = typeInfo.icon;
                      const isCredit = tx.to && tx.to._id === wallet.user;
                      return (
                        <div key={tx._id} className="flex items-center gap-3 rounded-lg bg-white p-3 border border-gray-100">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                            <Icon className={`h-3.5 w-3.5 ${isCredit ? "text-green-600" : "text-red-500"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">{typeInfo.label}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</p>
                          </div>
                          <p className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-red-500"}`}>
                            {isCredit ? "+" : "-"}{formatCurrency(tx.amount, tx.currency || "INR")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-400">Created</span>
              <span className="font-medium text-gray-700">{formatDateTime(wallet.createdAt)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPanel;
