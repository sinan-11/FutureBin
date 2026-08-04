import { memo } from "react";
import {
  FaWallet,
  FaTruck,
  FaCreditCard,
  FaUserTie,
  FaCoins,
  FaArrowRight,
} from "react-icons/fa";

import { formatCurrency } from "../../utils/helpers";
import { filterActionsForRole } from "../../utils/aiActions";

const CARD_ACTIONS = {
  wallet: [
    { label: "Show my recent transactions", intent: "wallet.transactions" },
    { label: "How do I add money to my wallet?", intent: "wallet.add_money" },
    { label: "How do I withdraw my earnings?", intent: "wallet.withdraw_how" },
  ],
  pickup: [
    { label: "Track my pickup on the map", intent: "pickup.track" },
    { label: "Show my past pickups", intent: "pickup.history" },
  ],
  payment: [{ label: "Show my payment history", intent: "payment.history" }],
  availability: [
    { label: "What pickups are assigned to me?", intent: "collector.assigned" },
  ],
  earnings: [
    { label: "How do I withdraw my earnings?", intent: "wallet.withdraw_how" },
    { label: "Show my recent transactions", intent: "wallet.transactions" },
  ],
  collector: [
    { label: "What's the status of my pickup?", intent: "pickup.current" },
  ],
};

const CARD_META = {
  wallet: { icon: FaWallet, color: "text-brand-600 bg-brand-50" },
  pickup: { icon: FaTruck, color: "text-brand-600 bg-brand-50" },
  payment: { icon: FaCreditCard, color: "text-warning bg-amber-50" },
  availability: { icon: FaUserTie, color: "text-brand-600 bg-brand-50" },
  earnings: { icon: FaCoins, color: "text-brand-600 bg-brand-50" },
  collector: { icon: FaUserTie, color: "text-brand-600 bg-brand-50" },
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs text-surface-500 dark:text-surface-400">{label}</span>
    <span className="text-xs font-semibold text-surface-800 dark:text-surface-800">{value}</span>
  </div>
);

const CardActionButton = ({ action, onAction }) => (
  <button
    type="button"
    onClick={() => onAction(action)}
    className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
  >
    {action.label}
    <FaArrowRight className="h-2.5 w-2.5" />
  </button>
);

const ResponseCard = memo(function ResponseCard({ card, onAction, role }) {
  const meta = CARD_META[card?.type];
  if (!meta || !card) return null;

  const Icon = meta.icon;
  const actions = filterActionsForRole(CARD_ACTIONS[card.type] || [], role);

  const renderBody = () => {
    switch (card.type) {
      case "wallet":
        return (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-4 text-white">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                Available Balance
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {formatCurrency(card.available)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Row label="Total Balance" value={formatCurrency(card.balance)} />
              <Row label="Held" value={formatCurrency(card.held)} />
            </div>
          </>
        );

      case "pickup":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  card.status === "completed"
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                    : "bg-brand-50 text-brand-700"
                }`}
              >
                {String(card.status || "").replace(/_/g, " ")}
              </span>
            </div>
            <Row label="Waste Type" value={card.wasteType} />
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-surface-500 dark:text-surface-400">Address</span>
              <span className="max-w-[60%] text-right text-xs font-semibold text-surface-800 dark:text-surface-800">
                {card.address || "—"}
              </span>
            </div>
            <Row
              label="Est. Price"
              value={formatCurrency(card.estimatedPrice)}
            />
            <Row
              label="Weight"
              value={`${card.actualWeight || card.estimatedWeight || "—"} kg`}
            />
          </div>
        );

      case "payment":
        return (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 px-4 py-4 text-white">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                {card.dueLabel || "Pending"}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {formatCurrency(card.amount)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Row label="Waste Type" value={card.wasteType} />
              <Row
                label="Status"
                value={String(card.status || "").replace(/_/g, " ")}
              />
            </div>
          </>
        );

      case "availability":
        return (
          <div className="flex items-center gap-3">
            <span
              className={`relative flex h-3 w-3 flex-shrink-0 ${
                card.isAvailable ? "text-success-500" : "text-surface-400 dark:text-surface-500"
              }`}
            >
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  card.isAvailable ? "animate-ping bg-success-400 opacity-60" : ""
                }`}
              />
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${
                  card.isAvailable
                    ? "bg-success-500"
                    : "bg-surface-400 dark:bg-surface-500"
                }`}
              />
            </span>
            <div>
              <p className="text-sm font-bold text-surface-900 dark:text-surface-900">{card.label}</p>
              {card.updatedAt && (
                <p className="text-[11px] text-surface-400 dark:text-surface-500">
                  Last updated{" "}
                  {new Date(card.updatedAt).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        );

      case "earnings":
        return (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-4 text-white">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
                Available Earnings
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {formatCurrency(card.available)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Row label="Total" value={formatCurrency(card.total)} />
              {card.recent?.length > 0 && (
                <div className="pt-1">
                  <p className="mb-1.5 text-[11px] font-semibold text-surface-500 dark:text-surface-400">
                    Recent earnings
                  </p>
                  <div className="space-y-1">
                    {card.recent.map((r, i) => (
                      <Row
                        key={i}
                        label={new Date(r.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                        value={`+${formatCurrency(r.amount)}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        );

      case "collector":
        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                {(card.name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-surface-900 dark:text-surface-900">{card.name}</p>
                <p className="text-[11px] text-surface-400 dark:text-surface-500">
                  {card.isAvailable ? "Available" : "Busy"}
                </p>
              </div>
            </div>
            <Row label="Phone" value={card.phone} />
            <Row label="Vehicle" value={card.vehicleNumber} />
            {card.pickupStatus && (
              <Row
                label="Pickup Status"
                value={String(card.pickupStatus).replace(/_/g, " ")}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-surface-100 dark:border-surface-200/60 bg-white dark:bg-surface-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-200/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.color}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <h4 className="text-sm font-bold text-surface-900 dark:text-surface-900">{card.title}</h4>
        </div>
      </div>

      <div className="space-y-2.5 px-4 py-3.5">{renderBody()}</div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-surface-100 dark:border-surface-200/60 px-4 py-3">
          {actions.map((action) => (
            <CardActionButton
              key={action.intent}
              action={action}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default ResponseCard;
