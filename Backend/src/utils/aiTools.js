import mongoose from "mongoose";

import User from "../models/User.js";
import PickupRequest from "../models/PickupRequest.js";
import Transaction from "../models/Transaction.js";

import * as walletService from "../services/walletService.js";
import * as pickupService from "../services/pickupService.js";
import * as subscriptionService from "../services/subscriptionService.js";
import * as userService from "../services/userService.js";
import * as settingService from "../services/settingService.js";

// ─── Tool Schemas ────────────────────────────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_wallet_balance",
      description:
        "Get the current wallet balance for the logged in user, including held and available amounts.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wallet_transactions",
      description:
        "Get the recent wallet transactions for the logged in user (top-ups, reservations, pickups, refunds, withdrawals).",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of transactions to return (default 10, max 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_active_pickup",
      description:
        "Get the current / active pickup for the logged in user, including status, waste type, collector and estimated price.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "track_pickup",
      description:
        "Get live tracking details for a specific pickup including the assigned collector's latest location.",
      parameters: {
        type: "object",
        properties: {
          pickupId: {
            type: "string",
            description: "The pickup request id",
          },
        },
        required: ["pickupId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_subscription",
      description:
        "Get the subscriptions for the logged in user (recurring scheduled pickups).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_payment_history",
      description:
        "Get the payment history for the logged in user (pickup payments, top-ups, extra payments).",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of payments to return (default 10, max 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_collector_details",
      description:
        "Get details of the collector assigned to the user's current pickup, including name, phone, availability and live location.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description:
        "Get the basic profile of the logged in user (name, email, role, verification status).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_withdrawal",
      description:
        "Get pending / processing withdrawal requests for the logged in collector.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pricing",
      description:
        "Get the current per-kilogram waste pricing and payment configuration (buffer and cancellation fees).",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ─── Tool Role Permissions ───────────────────────────────────────────────────

const TOOL_ROLES = {
  get_wallet_balance: ["resident", "collector"],
  get_wallet_transactions: ["resident", "collector"],
  get_active_pickup: ["resident", "collector"],
  track_pickup: ["resident", "collector"],
  get_subscription: ["resident"],
  get_payment_history: ["resident", "collector"],
  get_collector_details: ["resident"],
  get_user_profile: ["resident", "collector"],
  get_pending_withdrawal: ["collector"],
  get_pricing: ["resident", "collector"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const toPlain = (value) => JSON.parse(JSON.stringify(value));

const clampLimit = (value, fallback = 10, max = 20) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(Math.floor(num), max);
};

const ACTIVE_PICKUP_STATUSES = [
  "broadcasting",
  "accepted",
  "collector_arrived",
  "collecting",
  "weight_verified",
  "payment_pending",
  "paid",
  "awaiting_extra_payment",
];

const summarizePickup = (pickup) => ({
  id: pickup._id,
  status: pickup.status,
  wasteType: pickup.wasteType,
  estimatedWeight: pickup.estimatedWeight,
  actualWeight: pickup.actualWeight || null,
  estimatedPrice: pickup.estimatedPrice,
  finalPrice: pickup.finalPrice || null,
  pickupAddress: pickup.pickupAddress,
  scheduledAt: pickup.scheduledAt,
  paymentMethod: pickup.paymentMethod,
  paymentStatus: pickup.paymentStatus,
  collector: pickup.collector?.name || null,
  collectorPhone: pickup.collector?.collectorDetails?.phone || null,
  createdAt: pickup.createdAt,
});

// ─── Tool Handlers ───────────────────────────────────────────────────────────

const getWalletBalance = async (userId) => {
  const wallet = await walletService.getWalletByUser(userId);

  if (!wallet) {
    return {
      message: "No wallet found for this user. They need to create one to use payments.",
      hasWallet: false,
    };
  }

  return {
    hasWallet: true,
    balance: wallet.balance,
    heldBalance: wallet.heldBalance,
    availableBalance: wallet.balance - wallet.heldBalance,
    currency: wallet.currency,
    isActive: wallet.isActive,
  };
};

const getWalletTransactions = async (userId, args) => {
  const limit = clampLimit(args?.limit);
  const transactions = await walletService.getTransactions(userId);

  return {
    count: transactions.length,
    transactions: transactions.slice(0, limit).map((tx) => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency || "INR",
      status: tx.status,
      description: tx.description,
      paymentMethod: tx.paymentMethod,
      reference: tx.reference,
      createdAt: tx.createdAt,
    })),
  };
};

const getActivePickup = async (userId, role) => {
  if (role === "collector") {
    const data = await pickupService.getCollectorRequests(userId);
    const active = (data.active || [])[0];
    return { hasActivePickup: Boolean(active), pickup: active ? summarizePickup(active) : null };
  }

  const data = await pickupService.getResidentRequests(userId);
  const current = (data.current || []).map(summarizePickup);

  return {
    hasActivePickup: current.length > 0,
    count: current.length,
    pickups: current,
  };
};

const trackPickup = async (userId, role, args) => {
  const pickupId = args?.pickupId;

  if (!pickupId || !isObjectId(pickupId)) {
    return { error: "A valid pickupId is required." };
  }

  const pickup = await PickupRequest.findById(pickupId).populate(
    "collector",
    "name email isAvailable location collectorDetails.phone"
  );

  if (!pickup) return { error: "Pickup not found." };

  const isResident = String(pickup.resident) === String(userId);
  const isCollector = pickup.collector && String(pickup.collector._id) === String(userId);

  if (!isResident && !isCollector) {
    return { error: "You are not a participant of this pickup." };
  }

  const collectorLoc = pickup.collector?.location?.coordinates || null;

  return {
    pickup: summarizePickup(pickup),
    collectorLocation: collectorLoc
      ? { longitude: collectorLoc[0], latitude: collectorLoc[1] }
      : null,
    collectorAvailable: pickup.collector?.isAvailable ?? null,
  };
};

const getSubscription = async (userId, role) => {
  if (role !== "resident") {
    return { message: "Subscriptions are only available to resident accounts." };
  }

  const subscriptions = await subscriptionService.getSubscriptionsByResident(userId);

  return {
    count: subscriptions.length,
    subscriptions: subscriptions.map((sub) => ({
      id: sub._id,
      frequency: sub.frequency,
      dayOfWeek: sub.dayOfWeek,
      dayOfMonth: sub.dayOfMonth,
      pickupTime: sub.pickupTime,
      wasteType: sub.wasteType,
      estimatedWeight: sub.estimatedWeight,
      paymentMethod: sub.paymentMethod,
      status: sub.status,
      nextRunAt: sub.nextRunAt,
      lastRunAt: sub.lastRunAt,
      address: sub.address?.full || sub.address?.street || "",
    })),
  };
};

const getPaymentHistory = async (userId, args) => {
  const limit = clampLimit(args?.limit);

  const transactions = await Transaction.find({
    $or: [{ from: userId }, { to: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("pickupId", "pickupAddress wasteType status");

  return {
    count: transactions.length,
    payments: transactions.map((tx) => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency || "INR",
      status: tx.status,
      description: tx.description,
      paymentMethod: tx.paymentMethod,
      pickupAddress: tx.pickupId?.pickupAddress || null,
      createdAt: tx.createdAt,
    })),
  };
};

const getCollectorDetails = async (userId, role) => {
  if (role !== "resident") {
    return { message: "Collector details are shown to residents with an assigned pickup." };
  }

  const pickup = await PickupRequest.findOne({
    resident: userId,
    status: { $in: ACTIVE_PICKUP_STATUSES },
    collector: { $ne: null },
  }).populate("collector", "name email isAvailable location collectorDetails");

  if (!pickup || !pickup.collector) {
    return { message: "No assigned collector for the current pickup yet." };
  }

  const c = pickup.collector;
  const loc = c.location?.coordinates || null;

  return {
    pickupId: pickup._id,
    pickupStatus: pickup.status,
    collector: {
      name: c.name,
      email: c.email,
      isAvailable: c.isAvailable,
      phone: c.collectorDetails?.phone || null,
      vehicleNumber: c.collectorDetails?.vehicleNumber || null,
      location: loc ? { longitude: loc[0], latitude: loc[1] } : null,
    },
  };
};

const getUserProfile = async (userId) => {
  const user = await userService.getUserById(userId);

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    isApproved: user.isApproved,
    isAvailable: user.isAvailable,
  };
};

const getPendingWithdrawal = async (userId, role) => {
  if (role !== "collector") {
    return { message: "Withdrawals are only available to collector accounts." };
  }

  const withdrawals = await walletService.getWithdrawals(userId);
  const pending = withdrawals.filter((w) => w.status === "processing");

  return {
    count: pending.length,
    withdrawals: pending.map((w) => ({
      id: w._id,
      amount: w.amount,
      status: w.status,
      bankName: w.bankDetails?.bankName || "Bank account",
      accountLast4: w.bankDetails?.accountNumber
        ? w.bankDetails.accountNumber.slice(-4)
        : null,
      estimatedCreditTime: w.estimatedCreditTime,
      createdAt: w.createdAt,
    })),
  };
};

const getPricing = async () => {
  const prices = await settingService.getWastePrices();
  const config = await settingService.getPaymentConfig();

  return {
    pricesPerKg: {
      recyclable: prices.recyclable,
      organic: prices.organic,
      hazardous: prices.hazardous,
      electronic: prices.electronic,
      general: prices.general,
    },
    paymentConfig: {
      bufferPercent: config.bufferPercent,
      bufferMin: config.bufferMin,
      cancellationFeePercent: config.cancellationFeePercent,
      cancellationFeeMin: config.cancellationFeeMin,
    },
  };
};

// ─── Dispatcher ──────────────────────────────────────────────────────────────

const TOOL_HANDLERS = {
  get_wallet_balance: (userId, _role, _args) => getWalletBalance(userId),
  get_wallet_transactions: (userId, _role, args) => getWalletTransactions(userId, args),
  get_active_pickup: (userId, role, _args) => getActivePickup(userId, role),
  track_pickup: (userId, role, args) => trackPickup(userId, role, args),
  get_subscription: (userId, role, _args) => getSubscription(userId, role),
  get_payment_history: (userId, _role, args) => getPaymentHistory(userId, args),
  get_collector_details: (userId, role, _args) => getCollectorDetails(userId, role),
  get_user_profile: (userId, _role, _args) => getUserProfile(userId),
  get_pending_withdrawal: (userId, role, _args) => getPendingWithdrawal(userId, role),
  get_pricing: (_userId, _role, _args) => getPricing(),
};

/**
 * Execute a single tool for the logged in user.
 * Always scoped to the user's own data — never expose MongoDB directly.
 */
export const executeAiTool = async (name, userId, role, args) => {
  const handler = TOOL_HANDLERS[name];

  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }

  const allowedRoles = TOOL_ROLES[name];
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { error: `This action isn't available for your role (${role}).` };
  }

  try {
    const result = await handler(userId, role, args || {});
    return toPlain(result);
  } catch (error) {
    return {
      error: error.message || "Something went wrong while fetching this data",
    };
  }
};

export const isAiTool = (name) => Boolean(TOOL_HANDLERS[name]);

export default {
  TOOL_DEFINITIONS,
  executeAiTool,
  isAiTool,
};
