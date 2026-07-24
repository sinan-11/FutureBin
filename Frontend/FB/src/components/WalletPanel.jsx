import { useState, useEffect } from "react";
import {
  FaWallet, FaTimes, FaMoneyBillWave, FaHistory, FaArrowDown, FaArrowUp,
  FaSpinner, FaUniversity, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaCreditCard,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Loader from "./Loader";
import {
  getWalletService, createWalletService, getTransactionsService,
  withdrawFundsService, getWithdrawalsService,
} from "../services/walletService";
import { createOrder, verifyPayment } from "../api/paymentApi";
import { updateBankDetailsService } from "../services/userService";
import { formatDateTime, formatCurrency } from "../utils/helpers";

const TRANSACTION_TYPES = {
  TOPUP: { label: "Top-up", color: "text-green-600", icon: FaArrowDown, bg: "bg-green-100" },
  RESERVE: { label: "Reserved", color: "text-orange-500", icon: FaArrowUp, bg: "bg-orange-100" },
  EXTRA_RESERVE: { label: "Extra Reserved", color: "text-orange-500", icon: FaArrowUp, bg: "bg-orange-100" },
  RELEASE: { label: "Released", color: "text-blue-500", icon: FaArrowDown, bg: "bg-blue-100" },
  PICKUP_PAYMENT: { label: "Pickup Payment", color: "text-green-600", icon: FaArrowDown, bg: "bg-green-100" },
  CANCELLATION_FEE: { label: "Cancellation Fee", color: "text-red-500", icon: FaArrowUp, bg: "bg-red-100" },
  TRANSFER: { label: "Transfer", color: "text-purple-500", icon: FaArrowUp, bg: "bg-purple-100" },
  WITHDRAWAL: { label: "Withdrawal", color: "text-red-500", icon: FaArrowUp, bg: "bg-red-100" },
  REFUND: { label: "Refund", color: "text-green-500", icon: FaArrowDown, bg: "bg-green-100" },
};

const STATUS_STYLES = {
  processing: { label: "Processing", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  failed: { label: "Failed", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const BankDetailsForm = ({ bankDetails, setBankDetails, savingBank, handleSaveBank }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
    <div className="flex items-center gap-2 mb-1">
      <FaUniversity className="h-3.5 w-3.5 text-gray-400" />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bank Details</span>
    </div>
    <input
      type="text"
      placeholder="Account Holder Name"
      value={bankDetails.accountHolderName}
      onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
    />
    <input
      type="text"
      placeholder="Account Number"
      value={bankDetails.accountNumber}
      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
    />
    <div className="grid grid-cols-2 gap-2">
      <input
        type="text"
        placeholder="IFSC Code"
        value={bankDetails.ifscCode}
        onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      <input
        type="text"
        placeholder="Bank Name"
        value={bankDetails.bankName}
        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
    </div>
    <button
      onClick={handleSaveBank}
      disabled={savingBank}
      className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50"
    >
      {savingBank ? "Saving..." : "Save Bank Details"}
    </button>
  </div>
);

const WithdrawForm = ({ wallet, onDone }) => {
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "",
  });
  const [hasSavedBank, setHasSavedBank] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const available = wallet.balance - (wallet.heldBalance || 0);

  useEffect(() => {
    if (wallet.user?.bankDetails?.accountNumber) {
      setBankDetails(wallet.user.bankDetails);
      setHasSavedBank(true);
    }
  }, [wallet]);

  const handleSaveBank = async () => {
    if (!bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      toast.error("Fill in all required bank details");
      return;
    }
    setSavingBank(true);
    try {
      await updateBankDetailsService(bankDetails);
      setHasSavedBank(true);
      toast.success("Bank details saved");
    } catch (err) {
      toast.error(err.message || "Failed to save bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > available) {
      toast.error("Insufficient available balance");
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.ifscCode) {
      toast.error("Please save your bank details first");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await withdrawFundsService(amount, bankDetails);
      toast.success(res.message || `₹${amount} withdrawal submitted`);
      setWithdrawAmount("");
      onDone();
    } catch (err) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-800">Withdraw to Bank Account</h4>
      <BankDetailsForm
        bankDetails={bankDetails}
        setBankDetails={setBankDetails}
        savingBank={savingBank}
        handleSaveBank={handleSaveBank}
      />
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-700">Withdrawal Amount</span>
          <span className="text-xs text-blue-500">Available: {formatCurrency(available, wallet.currency)}</span>
        </div>
        <input
          type="number"
          min="1"
          max={available}
          placeholder="Enter amount"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold focus:border-blue-500 focus:outline-none"
        />
        <div className="flex gap-2">
          {[100, 500, 1000, 2000].filter((amt) => amt <= available).map((amt) => (
            <button
              key={amt}
              onClick={() => setWithdrawAmount(String(amt))}
              className="flex-1 rounded-lg border border-blue-200 bg-white py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              ₹{amt}
            </button>
          ))}
        </div>
        <button
          onClick={handleWithdraw}
          disabled={withdrawing || !withdrawAmount}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {withdrawing ? <><FaSpinner className="animate-spin" /> Processing...</> : "Withdraw to Bank"}
        </button>
      </div>
    </div>
  );
};

const WithdrawalHistory = ({ withdrawals, loading }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
    <h4 className="text-sm font-bold text-gray-700">Withdrawal History</h4>
    {loading ? (
      <div className="flex justify-center py-4"><FaSpinner className="animate-spin text-gray-400" /></div>
    ) : withdrawals.length === 0 ? (
      <p className="text-center text-sm text-gray-400 py-4">No withdrawals yet</p>
    ) : (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {withdrawals.map((wd) => {
          const st = STATUS_STYLES[wd.status] || STATUS_STYLES.processing;
          return (
            <div key={wd._id} className="rounded-lg bg-white p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <FaUniversity className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-700">
                    {wd.bankDetails.bankName || "Bank"} ••{wd.bankDetails.accountNumber.slice(-4)}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>
                  <span className={`h-1 w-1 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-red-500">-{formatCurrency(wd.amount, "INR")}</p>
                <span className="text-[10px] text-gray-400">{formatDateTime(wd.createdAt)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                <span>Ref: {wd.transaction?.reference || "N/A"}</span>
                {wd.status === "processing" && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <FaClock className="h-2.5 w-2.5" />
                    Expected: Within 24 hours
                  </span>
                )}
                {wd.status === "failed" && wd.failureReason && (
                  <span className="flex items-center gap-1 text-red-500">
                    <FaExclamationTriangle className="h-2.5 w-2.5" />
                    {wd.failureReason}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const TransactionHistory = ({ transactions, wallet, loading }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
    <h4 className="text-sm font-bold text-gray-700">Transactions</h4>
    {loading ? (
      <div className="flex justify-center py-4"><FaSpinner className="animate-spin text-gray-400" /></div>
    ) : transactions.length === 0 ? (
      <p className="text-center text-sm text-gray-400 py-4">No transactions yet</p>
    ) : (
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {transactions.map((tx) => {
          const typeInfo = TRANSACTION_TYPES[tx.type] || { label: tx.type, color: "text-gray-500", icon: FaArrowUp, bg: "bg-gray-100" };
          const txStatus = STATUS_STYLES[tx.status] || null;
          const Icon = typeInfo.icon;
          const isCredit = tx.to && tx.to._id === wallet.user;
          return (
            <div key={tx._id} className="flex items-center gap-3 rounded-lg bg-white p-3 border border-gray-100">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${typeInfo.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${typeInfo.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-gray-700 truncate">{typeInfo.label}</p>
                  {txStatus && (
                    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${txStatus.color}`}>
                      {txStatus.label}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">{formatDateTime(tx.createdAt)}</p>
                {tx.reference && <p className="text-[10px] text-gray-300">Ref: {tx.reference}</p>}
                {tx.status === "processing" && (
                  <p className="text-[10px] text-orange-500 flex items-center gap-1 mt-0.5">
                    <FaClock className="h-2 w-2" /> Expected credit: Within 24 hours
                  </p>
                )}
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
);

const WalletPanel = ({ onClose, role }) => {
  const [wallet, setWallet] = useState(null);
  const [hasWallet, setHasWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const isCollector = role === "collector";

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

  const loadTabData = async (tab) => {
    setActiveTab(tab);
    setShowTopUp(false);
    setShowWithdraw(false);
    setLoadingData(true);
    try {
      if (tab === "transactions") {
        const txs = await getTransactionsService();
        setTransactions(txs);
      } else if (tab === "withdrawals") {
        const wds = await getWithdrawalsService();
        setWithdrawals(wds);
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  };

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

              {isCollector ? (
                <button
                  onClick={() => { setShowWithdraw(true); setShowTopUp(false); setActiveTab(null); }}
                  className={`flex w-full items-center gap-4 rounded-xl border p-3 transition-colors ${
                    showWithdraw ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <FaUniversity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-700 text-sm">Withdraw Money</p>
                    <p className="text-xs text-gray-400">Transfer to your bank account</p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => { setShowTopUp(true); setShowWithdraw(false); setActiveTab(null); }}
                  className={`flex w-full items-center gap-4 rounded-xl border p-3 transition-colors ${
                    showTopUp ? "border-green-300 bg-green-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <FaMoneyBillWave className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-700 text-sm">Add Money</p>
                    <p className="text-xs text-gray-400">Top up via Razorpay</p>
                  </div>
                </button>
              )}

              {isCollector && (
                <button
                  onClick={() => loadTabData("withdrawals")}
                  className={`flex w-full items-center gap-4 rounded-xl border p-3 transition-colors ${
                    activeTab === "withdrawals" ? "border-orange-300 bg-orange-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <FaCreditCard className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-700 text-sm">Withdrawal History</p>
                    <p className="text-xs text-gray-400">View all withdrawal requests</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => loadTabData("transactions")}
                className={`flex w-full items-center gap-4 rounded-xl border p-3 transition-colors ${
                  activeTab === "transactions" ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                }`}
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

            {/* Top-up Section (Residents) */}
            {showTopUp && !isCollector && (
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

            {/* Withdraw Section (Collectors) */}
            {showWithdraw && isCollector && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <WithdrawForm wallet={wallet} onDone={() => { setShowWithdraw(false); load(); }} />
              </div>
            )}

            {/* Withdrawal History Tab */}
            {activeTab === "withdrawals" && isCollector && (
              <WithdrawalHistory withdrawals={withdrawals} loading={loadingData} />
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <TransactionHistory transactions={transactions} wallet={wallet} loading={loadingData} />
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
