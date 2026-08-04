import OpenAI from "openai";
import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import {
  TOOL_DEFINITIONS,
  executeAiTool,
} from "../utils/aiTools.js";

import * as walletService from "../services/walletService.js";
import * as pickupService from "../services/pickupService.js";
import * as subscriptionService from "../services/subscriptionService.js";

const HISTORY_LIMIT = 30;
const MAX_ROUNDS = 4;
const MAX_MESSAGE_LENGTH = 2000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

const sanitizeContent = (content) =>
  String(content || "")
    .replace(/\0/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

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

// ─── AI Client ───────────────────────────────────────────────────────────────

let aiClient = null;

export const getAIClient = () => {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey || apiKey === "your_groq_api_key_here") {
    const err = new Error(
      "AI is not configured yet. Set AI_API_KEY in the backend environment."
    );
    err.status = 503;
    throw err;
  }

  if (!aiClient) {
    aiClient = new OpenAI({
      apiKey,
      baseURL: process.env.AI_BASE_URL || undefined,
    });
  }

  return aiClient;
};

export const getAIModel = () => process.env.AI_MODEL || "llama-3.3-70b-versatile";

// ─── Conversations ───────────────────────────────────────────────────────────

export const createConversation = async (userId, title) => {
  const conversation = await Conversation.create({
    user: userId,
    title: sanitizeContent(title)?.slice(0, 60) || "New conversation",
  });

  return conversation;
};

export const listConversations = async (userId) => {
  const conversations = await Conversation.find({ user: userId })
    .sort({ updatedAt: -1 })
    .lean();

  if (conversations.length === 0) return [];

  const previews = await Message.aggregate([
    { $match: { conversation: { $in: conversations.map((c) => c._id) } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$conversation",
        content: { $first: "$content" },
        role: { $first: "$role" },
        lastMessageAt: { $first: "$createdAt" },
      },
    },
  ]);

  const previewMap = {};
  for (const row of previews) {
    previewMap[String(row._id)] = row;
  }

  return conversations.map((conversation) => {
    const preview = previewMap[String(conversation._id)];
    return {
      ...conversation,
      preview: preview?.content?.slice(0, 80) || "No messages yet",
    };
  });
};

export const getConversationMessages = async (userId, conversationId, options = {}) => {
  if (!isObjectId(conversationId)) {
    const err = new Error("Invalid conversation id");
    err.status = 400;
    throw err;
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    user: userId,
  });

  if (!conversation) {
    const err = new Error("Conversation not found");
    err.status = 404;
    throw err;
  }

  const limit = Math.min(Math.max(Number(options.limit) || 30, 1), 50);
  const filter = { conversation: conversationId };

  if (options.before && isObjectId(options.before)) {
    filter._id = { $lt: options.before };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  messages.reverse();

  const hasMore = messages.length === limit;

  return { conversation, messages, hasMore };
};

export const deleteConversation = async (userId, conversationId) => {
  if (!isObjectId(conversationId)) {
    const err = new Error("Invalid conversation id");
    err.status = 400;
    throw err;
  }

  const conversation = await Conversation.findOneAndDelete({
    _id: conversationId,
    user: userId,
  });

  if (!conversation) {
    const err = new Error("Conversation not found");
    err.status = 404;
    throw err;
  }

  await Message.deleteMany({ conversation: conversationId });

  return conversation;
};

// ─── System Prompt & Dynamic Context ─────────────────────────────────────────

const buildDynamicContext = async (user) => {
  const pickupsPromise =
    user.role === "resident"
      ? pickupService.getResidentRequests(user._id)
      : user.role === "collector"
        ? pickupService.getCollectorRequests(user._id)
        : Promise.resolve([]);

  const subscriptionsPromise =
    user.role === "resident"
      ? subscriptionService.getSubscriptionsByResident(user._id)
      : Promise.resolve([]);

  const results = await Promise.allSettled([
    walletService.getWalletByUser(user._id),
    pickupsPromise,
    subscriptionsPromise,
    walletService.getTransactions(user._id),
  ]);

  const [walletRes, pickupRes, subRes, txRes] = results;

  const wallet =
    walletRes.status === "fulfilled" ? walletRes.value : null;
  const pickups =
    pickupRes.status === "fulfilled"
      ? pickupRes.value.current || pickupRes.value.active || []
      : [];
  const subscriptions =
    subRes.status === "fulfilled" ? subRes.value : [];
  const transactions =
    txRes.status === "fulfilled" ? txRes.value : [];

  const activePickup = pickups[0] || null;

  const context = [
    `- User: ${user.name} (${user.role})`,
    wallet
      ? `- Wallet balance: ${inr(wallet.balance)} (held ${inr(wallet.heldBalance)}, available ${inr(wallet.balance - wallet.heldBalance)})`
      : "- Wallet: not created yet",
    activePickup
      ? `- Active pickup: ${activePickup.status} — ${activePickup.wasteType}, ${inr(activePickup.estimatedPrice || 0)}, ${activePickup.pickupAddress}`
      : "- Active pickup: none",
    subscriptions.length > 0
      ? `- Subscriptions: ${subscriptions.length} (${subscriptions.filter((s) => s.status === "active").length} active)`
      : "- Subscriptions: none",
    transactions.length > 0
      ? `- Recent payments: ${transactions.length} recorded`
      : "- Recent payments: none",
  ];

  if (user.role === "collector") {
    context.push(`- Availability: ${user.isAvailable ? "available" : "offline"}`);
  }

  return context.join("\n");
};

const buildSystemPrompt = async (user) => {
  const context = await buildDynamicContext(user);

  return [
    `You are "FutureBin AI", the built-in intelligent assistant of the FutureBin smart waste management platform.`,
    `NEVER identify yourself as ChatGPT, OpenAI, or any third-party model or company. You are FutureBin's own in-app assistant.`,
    `You help users manage waste pickups, subscriptions, wallets, payments, collectors and recycling.`,
    `Always be polite, professional, friendly and concise. Keep answers short unless the user asks for more detail.`,
    `Use ₹ (Indian Rupees) and the Indian number format when mentioning amounts. You may use simple Markdown for lists.`,
    `Never invent data. If a tool returns nothing or an error, say so honestly and suggest what the user can do next.`,
    `Never expose technical details like user ids, hashes or internal identifiers to the user.`,
    ``,
    `## Intent detection`,
    `Before calling any tool, classify the user's message into exactly one of these categories:`,
    `- **Information** — the user asks HOW, WHAT, WHY or WHEN and wants an explanation (e.g. "how do I withdraw my earnings", "how does a subscription work", "what is e-waste", "when do collectors get paid"). Respond from your knowledge only. Do NOT call any tool and do NOT show live balances, transactions, pending withdrawals or account details.`,
    `- **Action** — the user explicitly asks for their own live data or wants an operation performed (e.g. "show my wallet balance", "how much have I earned", "show my transactions", "where is my collector", "what's my active pickup", "what's my average rating", "show my pending payments"). Call the appropriate tool and present the real data.`,
    `- **Conversation** — casual chat, greetings, small talk or general questions. Respond naturally without tools.`,
    ``,
    `## Intent rules`,
    `- If the user asks HOW something works or HOW to do something, treat it as Information. Never fetch live data for "how" questions.`,
    `- Never mix an explanation with live figures. If the user asks "how do I withdraw", give the steps only — do not mention their balance, pending withdrawals or transactions.`,
    `- "What", "which" or "how much" about the user's own account is an Action ("what's my balance", "how much have I earned"), but the same words about how the platform works is Information ("what is the recycling process", "how does pricing work").`,
    `- "What are the current pickup rates" is an Action: the user wants the actual price list.`,
    `- When in doubt, do not call a tool. Answer helpfully and offer to look up the user's live data.`,
    ``,
    `## About FutureBin`,
    `- Waste pickups: users request a pickup, a nearby approved collector accepts, the collector arrives, weighs the waste and the resident verifies completion with an OTP.`,
    `- Wallet: prepaid balance used to pay for pickups. Amounts are reserved when a pickup is created and settled after completion; over-weight pickups may need an extra payment.`,
    `- Subscriptions: recurring scheduled pickups (weekly or monthly) that auto-create pickup requests.`,
    `- Collectors earn money per pickup; funds land in their wallet and can be withdrawn to a bank account (usually credited within 24 hours).`,
    `- Waste types: recyclable, organic, hazardous, electronic and general waste.`,
    ``,
    `## Current user context`,
    context,
  ].join("\n");
};

// ─── Suggested actions after replies ─────────────────────────────────────────

const action = (label, payload) => ({ label, ...payload });

const INTENT_ROLES = {
  // ─── Wallet ───
  "wallet.balance": ["resident", "collector", "admin"],
  "wallet.transactions": ["resident", "collector", "admin"],
  "wallet.add_money": ["resident"],
  "wallet.withdrawals": ["collector"],
  "wallet.withdraw_how": ["collector"],
  "wallet.how": ["resident", "collector"],

  // ─── Subscriptions (residents only) ───
  "subscription.view": ["resident"],
  "subscription.create": ["resident"],
  "subscription.edit": ["resident"],
  "subscription.cancel": ["resident"],
  "subscription.how": ["resident"],

  // ─── Pickups ───
  "pickup.current": ["resident"],
  "pickup.track": ["resident"],
  "pickup.history": ["resident", "collector"],
  "pickup.create": ["resident"],
  "pickup.report_issue": ["resident"],

  // ─── Payments ───
  "payment.pending": ["resident", "collector"],
  "payment.history": ["resident", "collector"],
  "payment.extra": ["resident"],
  "payment.cash": ["resident"],

  // ─── Collector ───
  "collector.availability": ["collector", "resident"],
  "collector.navigation": ["resident"],
  "collector.assigned": ["collector"],
  "collector.earnings": ["collector"],

  // ─── Waste Guide ───
  "waste.guide": ["resident", "collector", "admin"],
  "waste.plastic": ["resident", "collector", "admin"],
  "waste.glass": ["resident", "collector", "admin"],
  "waste.paper": ["resident", "collector", "admin"],
  "waste.metal": ["resident", "collector", "admin"],
  "waste.organic": ["resident", "collector", "admin"],
  "waste.electronic": ["resident", "collector", "admin"],
  "waste.hazardous": ["resident", "collector", "admin"],

  // ─── FAQs ───
  "faq.otp": ["resident", "collector"],
  "faq.skipped": ["resident"],
  "faq.payment_failed": ["resident", "collector"],
  "faq.collector": ["resident"],
  "faq.subscription": ["resident"],
  "faq.wallet": ["resident", "collector"],
  "faq.extra_payment": ["resident"],

  // ─── Pricing & Support ───
  pricing: ["resident", "collector", "admin"],
  "contact.support": ["resident", "collector", "admin"],
};

const isIntentAllowedForRole = (intent, role) =>
  Boolean(INTENT_ROLES[intent]?.includes(role));

const isActionAllowedForRole = (a, role) =>
  !a.intent || isIntentAllowedForRole(a.intent, role);

const filterActionsForRole = (actions, role) =>
  (actions || []).filter((a) => isActionAllowedForRole(a, role));

const actionsForTools = (tools, role) => {
  const set = new Set(tools);
  const actions = [];

  if (set.has("get_wallet_balance") || set.has("get_wallet_transactions")) {
    actions.push(
      action("Show my recent transactions", { intent: "wallet.transactions" }),
      action("How do I add money to my wallet?", { intent: "wallet.add_money" }),
      set.has("get_wallet_balance")
        ? action("How do I withdraw my earnings?", { intent: "wallet.withdraw_how" })
      : null
    );
  }

  if (set.has("get_active_pickup") || set.has("track_pickup") || set.has("get_collector_details")) {
    if (role === "collector") {
      actions.push(
        action("What pickups are assigned to me?", { intent: "collector.assigned" }),
        action("What's my current availability?", { intent: "collector.availability" }),
        action("How much have I earned?", { intent: "collector.earnings" })
      );
    } else {
      actions.push(
        action("Track my pickup on the map", { intent: "pickup.track" }),
        action("Show my past pickups", { intent: "pickup.history" })
      );
    }
  }

  if (set.has("get_subscription")) {
    actions.push(
      action("How do I create a subscription?", { intent: "subscription.create" }),
      action("How do subscriptions work?", { intent: "subscription.how" })
    );
  }

  if (set.has("get_payment_history")) {
    actions.push(
      action("Do I have a pending payment?", { intent: "payment.pending" }),
      action("Check my wallet balance", { intent: "wallet.balance" })
    );
  }

  if (set.has("get_pending_withdrawal")) {
    actions.push(
      action("Check my wallet balance", { intent: "wallet.balance" }),
      action("Show my transaction history", { intent: "wallet.transactions" })
    );
  }

  if (set.has("get_pricing")) {
    actions.push(
      action("How should I sort my waste?", { intent: "waste.guide" }),
      action("Book a pickup for me", { intent: "pickup.create" })
    );
  }

  return filterActionsForRole(actions.filter(Boolean), role).slice(0, 4);
};

// ─── Intent Router (deterministic guided actions — no LLM) ──────────────────

const guideWaste = {
  plastic:
    "**Plastic waste** is usually **recyclable** in FutureBin.\n\n- Rinse and dry containers before disposal.\n- Separate bottle caps and labels where possible.\n- Avoid mixing plastic with organic waste.\n- Soft plastics like carry bags can be packed together.\n\nChoose a **recyclable** pickup to have plastic collected and weighed.",
  glass:
    "**Glass** is **recyclable**.\n\n- Wrap broken glass securely to avoid injuries to the collector.\n- Rinse jars and bottles; caps can be removed.\n- Do not put glass in the organic waste bin.\n\nSchedule a **recyclable** pickup and keep glass items together.",
  paper:
    "**Paper** is **recyclable**.\n\n- Keep paper dry — wet paper can't be recycled easily.\n- Remove plastic laminates, tapes and staples where possible.\n- Cardboard can be flattened to save space.\n\nSchedule a **recyclable** pickup to have paper collected.",
  metal:
    "**Metal** is **recyclable** and has good scrap value.\n\n- Cans, utensils, wires and small metal items can be collected.\n- Keep sharp or heavy metal pieces safely packed.\n- Do not mix with organic or hazardous waste.\n\nUse a **recyclable** pickup for metal waste.",
  organic:
    "**Organic waste** (food scraps, garden waste, peels) is compostable.\n\n- Keep it in a sealed bin or bag to avoid odours and pests.\n- Do not mix in plastics, glass or e-waste.\n- Ideal for frequent pickups since it decomposes quickly.\n\nSchedule an **organic** pickup for this waste type.",
  electronic:
    "**Electronic waste** (e-waste) includes phones, chargers, batteries, wires and gadgets.\n\n- Never throw batteries or electronics in general waste.\n- Remove personal data from devices before disposal.\n- E-waste should be handled separately for safe recycling.\n\nBook an **electronic** waste pickup so it's processed responsibly.",
  hazardous:
    "**Hazardous waste** (paints, chemicals, batteries, oils, medical waste) needs careful handling.\n\n- Keep it separate from all other waste.\n- Pack liquids in sealed, leak-proof containers.\n- Label the bag/container clearly.\n- Never mix with recyclables or organics.\n\nSchedule a **hazardous** waste pickup for safe collection.",
};

const FAQS = {
  "faq.otp":
    "OTP verification works like this:\n\n1. After your pickup is **weight verified**, an OTP is sent to your email.\n2. Share the OTP with your collector.\n3. The collector enters the OTP to confirm the pickup is complete and payment settles.\n\nIf you didn't receive it, check spam or ask the collector to **regenerate** the OTP from the app.",
  "faq.skipped":
    "A subscription pickup may be skipped when the payment can't be processed, for example if your **wallet doesn't have enough available balance** at the time of the run.\n\nTo avoid this:\n- Keep your wallet topped up before the scheduled day.\n- The platform will notify you when a pickup is skipped.\n\nCheck your subscription status and wallet balance anytime — just ask me.",
  "faq.payment_failed":
    "If a payment fails, the amount is **never deducted twice**.\n\n- For wallet payments, if there was insufficient balance the pickup won't proceed.\n- For Razorpay (card/UPI), failed charges are auto-refunded by the bank.\n\nYou can check your wallet balance and transaction history here, and if you still see a wrong charge, contact support and we'll look into it right away.",
  "faq.collector":
    "When you create a pickup, FutureBin finds **approved collectors who are currently available** within the search radius.\n\nThe request is broadcast to them, and the first one to accept gets assigned. You can track the collector's live location on the map once assigned.",
  "faq.subscription":
    "Subscriptions auto-create a pickup for you on a **weekly or monthly** schedule.\n\n- Pick your frequency, day, time, waste type and address.\n- Payment is settled per pickup from your wallet (or cash).\n- You can pause, resume, edit or cancel anytime.\n\nThere is no upfront fee — you pay only for each pickup.",
  "faq.wallet":
    "The FutureBin wallet is a prepaid balance used to pay for pickups.\n\n- When you create a pickup, an estimated amount (plus a small buffer) is **reserved**.\n- After weighing, the exact amount is **settled** and extra holds are released.\n- Collectors earn into their wallet and can **withdraw** to their bank (usually within 24 hours).\n- Residents can **top up** via Razorpay (UPI/cards).",
  "faq.extra_payment":
    "When your pickup's **actual weight is more than estimated**, an extra payment may be required.\n\nYou can pay it:\n- From your **wallet** (if you have enough available balance), or\n- **Online** via Razorpay.\n\nThe pickup is completed only after the extra amount is settled.",
};

const WASTE_GUIDE_ACTIONS = () => [
  action("How do I recycle plastic?", { intent: "waste.plastic" }),
  action("How do I dispose of glass?", { intent: "waste.glass" }),
  action("How do I recycle paper?", { intent: "waste.paper" }),
  action("How do I recycle metal?", { intent: "waste.metal" }),
  action("How do I compost organic waste?", { intent: "waste.organic" }),
  action("How do I dispose of e-waste?", { intent: "waste.electronic" }),
  action("How do I dispose of hazardous waste?", { intent: "waste.hazardous" }),
];

const INTENT_HANDLERS = {
  // ─── Wallet ───
  "wallet.balance": {
    async resolve(userId, user) {
      return executeAiTool("get_wallet_balance", userId, user.role, {});
    },
    async format(data) {
      if (!data.hasWallet) {
        return "You don't have a wallet yet. Create one to start using payments, or ask me for help.";
      }
      return [
        `Your **wallet balance** is **${inr(data.balance)}**.`,
        "",
        `- Held: ${inr(data.heldBalance)}`,
        `- Available: ${inr(data.availableBalance)}`,
      ].join("\n");
    },
    card(data) {
      return data.hasWallet ? walletCard(data) : null;
    },
    actions: () => [
      action("Show my recent transactions", { intent: "wallet.transactions" }),
      action("How do I add money to my wallet?", { intent: "wallet.add_money" }),
      action("How do I withdraw my earnings?", { intent: "wallet.withdraw_how" }),
    ],
  },

  "wallet.transactions": {
    async resolve(userId, user) {
      return executeAiTool("get_wallet_transactions", userId, user.role, { limit: 10 });
    },
    async format(data) {
      if (!data.transactions || data.transactions.length === 0) {
        return "You have **no transactions yet**. Once you top up or book a pickup, they'll show up here.";
      }
      const lines = data.transactions.map(
        (tx, i) => `${i + 1}. **${tx.type.replace(/_/g, " ").toLowerCase()}** — ${inr(tx.amount)} (${tx.status}) — ${tx.description}`
      );
      return `Here are your recent transactions:\n\n${lines.join("\n")}`;
    },
    actions: () => [
      action("Check my wallet balance", { intent: "wallet.balance" }),
      action("How do I add money to my wallet?", { intent: "wallet.add_money" }),
      action("Do I have a pending payment?", { intent: "payment.pending" }),
    ],
  },

  "wallet.add_money": {
    async resolve() {
      return { needsAction: true };
    },
    async format() {
      return [
        "You can **add money** to your wallet using Razorpay (UPI, cards or netbanking).",
        "",
        "1. Open your **Wallet** in the app.",
        "2. Tap **Add Money**.",
        "3. Enter the amount and complete the payment.",
        "",
        "Your balance updates instantly once the payment is verified.",
      ].join("\n");
    },
    actions: () => [
      action("Check my wallet balance", { intent: "wallet.balance" }),
      action("Open my wallet", { path: "wallet" }),
    ],
  },

  "wallet.withdrawals": {
    async resolve(userId, user) {
      return executeAiTool("get_pending_withdrawal", userId, user.role, {});
    },
    async format(data, user) {
      if (user.role !== "collector") {
        return "Withdrawals are available for **collector** accounts. As a resident, your wallet is used to pay for pickups. You can still **check your balance** or **top up** anytime.";
      }
      if (data.count === 0) {
        return "You have **no pending withdrawals** right now. When you submit a withdrawal, it usually credits to your bank within 24 hours.";
      }
      return data.withdrawals
        .map(
          (w) =>
            `- **${inr(w.amount)}** to ${w.bankName || "your bank"} (••${w.accountLast4 || "••••"}) — ${w.status}. Expected credit by ${formatDate(w.estimatedCreditTime)}.`
        )
        .join("\n\n");
    },
    actions: () => [
      action("Check my wallet balance", { intent: "wallet.balance" }),
      action("Show my transaction history", { intent: "wallet.transactions" }),
    ],
  },

  "wallet.how": {
    async resolve() {
      return { answer: FAQS["faq.wallet"] };
    },
    format: (data) => data.answer,
    actions: () => [
      action("Check my wallet balance", { intent: "wallet.balance" }),
      action("How do I add money to my wallet?", { intent: "wallet.add_money" }),
    ],
  },

  "wallet.withdraw_how": {
    async resolve() {
      return {
        answer: "You can withdraw your earnings from your Wallet:\n\n1. Open your **Wallet** from the dashboard.\n2. Select **Withdraw Earnings**.\n3. Enter the amount you want to withdraw.\n4. Choose or confirm your bank account.\n5. Submit the request.\n\nOnce your request is submitted, it will be processed and the amount will be transferred to your registered bank account, usually within 24 hours. If you'd like, I can also explain the withdrawal requirements or processing times.",
      };
    },
    format: (data) => data.answer,
    actions: () => [
      action("How much have I earned?", { intent: "collector.earnings" }),
      action("Show my pending withdrawals", { intent: "wallet.withdrawals" }),
    ],
  },

  // ─── Subscriptions ───
  "subscription.view": {
    async resolve(userId, user) {
      return executeAiTool("get_subscription", userId, user.role, {});
    },
    async format(data) {
      if (data.count === 0) {
        return "You have **no subscriptions** yet. Create one to automate your recurring pickups.";
      }
      const lines = data.subscriptions.map(
        (s) =>
          `- **${s.frequency}** ${s.wasteType} pickup — ${s.status} — next run: ${formatDate(s.nextRunAt)} — ${inr(0)}`
      );
      return `You have **${data.count} subscription${data.count > 1 ? "s" : ""}**:\n\n${lines.join("\n")}`;
    },
    actions: () => [
      action("How do I create a subscription?", { intent: "subscription.create" }),
      action("How do subscriptions work?", { intent: "subscription.how" }),
    ],
  },

  "subscription.create": {
    async resolve() {
      return { answer: "You can create a new subscription from the **My Subscriptions** page. Choose weekly or monthly, pick your schedule, waste type, address and payment method. There's no upfront fee — you pay per pickup." };
    },
    format: (data) => data.answer,
    actions: () => [
      action("Show my subscriptions", { intent: "subscription.view" }),
      action("Open my subscriptions", { path: "subscriptions" }),
    ],
  },

  "subscription.edit": {
    async resolve() {
      return { answer: "You can edit an active or paused subscription from **My Subscriptions**. Tap a subscription and choose **Edit** to change the schedule, waste type, weight or address. Note: a subscription that is currently being processed can't be edited for a few minutes." };
    },
    format: (data) => data.answer,
    actions: () => [
      action("Show my subscriptions", { intent: "subscription.view" }),
      action("Open my subscriptions", { path: "subscriptions" }),
    ],
  },

  "subscription.cancel": {
    async resolve() {
      return { answer: "To cancel a subscription, go to **My Subscriptions**, open the subscription and tap **Cancel**. Cancelled subscriptions stop generating pickups. You can delete them afterwards if you like." };
    },
    format: (data) => data.answer,
    actions: () => [
      action("Show my subscriptions", { intent: "subscription.view" }),
      action("Open my subscriptions", { path: "subscriptions" }),
    ],
  },

  "subscription.how": {
    async resolve() {
      return { answer: FAQS["faq.subscription"] };
    },
    format: (data) => data.answer,
    actions: () => [
      action("Show my subscriptions", { intent: "subscription.view" }),
      action("How do I create a subscription?", { intent: "subscription.create" }),
    ],
  },

  // ─── Pickup Requests ───
  "pickup.current": {
    async resolve(userId, user) {
      return executeAiTool("get_active_pickup", userId, user.role, {});
    },
    async format(data) {
      if (!data.hasActivePickup) {
        return "You have **no active pickup** right now. Want to create one?";
      }
      if (data.pickup) {
        const p = data.pickup;
        return `Your current pickup:\n\n- **Status:** ${p.status.replace(/_/g, " ")}\n- **Waste type:** ${p.wasteType}\n- **Address:** ${p.pickupAddress}\n- **Estimated price:** ${inr(p.estimatedPrice)}`;
      }
      const first = data.pickups?.[0];
      return `You have **${data.count} active pickup(s)**. The latest is **${first.status}** — ${first.wasteType} waste at ${first.pickupAddress} (${inr(first.estimatedPrice)}).`;
    },
    card(data) {
      const p = data.pickup || data.pickups?.[0];
      return p ? { ...pickupCard(p), title: "Pickup Status" } : null;
    },
    actions: () => [
      action("Track my pickup on the map", { intent: "pickup.track" }),
      action("Show my past pickups", { intent: "pickup.history" }),
    ],
  },

  "pickup.track": {
    async resolve(userId, user) {
      const active = await executeAiTool("get_active_pickup", userId, user.role, {});
      const pickup = active.pickup || active.pickups?.[0];
      if (!pickup) return { hasActivePickup: false };
      return executeAiTool("track_pickup", userId, user.role, { pickupId: pickup.id });
    },
    async format(data) {
      if (data.error) return `I couldn't find that pickup. ${data.error}`;
      if (!data.hasActivePickup && !data.pickup) {
        return "You have **no active pickup** to track right now.";
      }
      const p = data.pickup;
      const loc = data.collectorLocation;
      return [
        `Your pickup is currently **${p.status.replace(/_/g, " ")}**.`,
        loc
          ? `The collector is on the move — open the **Live Tracking** map on the dashboard to see their exact position.`
          : "The collector's live location isn't available yet. Check back once the pickup is accepted.",
        "",
        `- Waste type: ${p.wasteType}`,
        `- Address: ${p.pickupAddress}`,
      ].join("\n");
    },
    actions: () => [
      action("What's the status of my pickup?", { intent: "pickup.current" }),
      action("How do I contact support?", { intent: "contact.support" }),
    ],
  },

  "pickup.history": {
    async resolve(userId, user) {
      if (user.role === "collector") {
        const data = await pickupService.getCollectorRequests(userId);
        return { pickups: (data.completed || []).map(summarizePickup).slice(0, 10) };
      }
      const data = await pickupService.getResidentRequests(userId);
      return { pickups: [...data.completed, ...data.cancelled].map(summarizePickup).slice(0, 10) };
    },
    async format(data) {
      if (!data.pickups || data.pickups.length === 0) {
        return "You have **no past pickups** yet.";
      }
      const lines = data.pickups.map(
        (p, i) => `${i + 1}. ${p.wasteType} — ${inr(p.finalPrice || p.estimatedPrice)} — ${p.status} — ${formatDate(p.completedAt || p.cancelledAt || p.createdAt)}`
      );
      return `Your recent pickups:\n\n${lines.join("\n")}`;
    },
    actions: (data, user) =>
      user.role === "collector"
        ? [
            action("What pickups are assigned to me?", { intent: "collector.assigned" }),
            action("How much have I earned?", { intent: "collector.earnings" }),
          ]
        : [
            action("What's the status of my pickup?", { intent: "pickup.current" }),
            action("Book a pickup for me", { intent: "pickup.create" }),
          ],
  },

  "pickup.create": {
    async resolve() {
      return { answer: "To create a pickup:\n\n1. Open **New Request** from the dashboard.\n2. Choose the waste type and estimated weight.\n3. Set your pickup address and time.\n4. Pick a payment method (wallet or cash) and submit.\n\nA nearby available collector will accept it shortly." };
    },
    format: (data) => data.answer,
    actions: () => [
      action("What's the status of my pickup?", { intent: "pickup.current" }),
      action("What are the current pickup rates?", { intent: "pricing" }),
    ],
  },

  "pickup.report_issue": {
    async resolve() {
      return { answer: "I'm sorry to hear there's an issue with your pickup. Here's what helps us resolve it fast:\n\n- Mention your **pickup** or **address**.\n- Share what went wrong (no-show, wrong weight, damaged waste, etc.).\n\nYou can also raise this with your collector via **Chat** on the active pickup, or reach **Contact Support** and we'll take care of it." };
    },
    format: (data) => data.answer,
    actions: () => [
      action("How do I contact support?", { intent: "contact.support" }),
      action("What's the status of my pickup?", { intent: "pickup.current" }),
    ],
  },

  // ─── Payments ───
  "payment.pending": {
    async resolve(userId, user) {
      const active = await executeAiTool("get_active_pickup", userId, user.role, {});
      const pickup = active.pickup || active.pickups?.[0];
      return pickup ? { pickup } : { noPickup: true };
    },
    async format(data) {
      if (data.noPickup) return "You have **no active pickup**, so there's nothing pending to pay.";
      const p = data.pickup;
      const pending =
        p.paymentStatus === "awaiting_extra_payment" || p.status === "payment_pending";
      if (p.paymentStatus === "awaiting_extra_payment") {
        return `There's an **extra payment pending** for your pickup. The final weight was higher than estimated, so you need to pay the difference.\n\n- Pickup: ${p.wasteType} at ${p.pickupAddress}\n- Status: ${p.status.replace(/_/g, " ")}`;
      }
      return pending
        ? `Your pickup has a **pending payment** (${p.paymentStatus}). Complete the OTP verification with the collector to settle it.`
        : `Good news — your current pickup has **no pending payment** (${p.paymentStatus || p.status}).`;
    },
    card(data) {
      if (data.noPickup || !data.pickup) return null;
      const p = data.pickup;
      const pending =
        p.paymentStatus === "awaiting_extra_payment" || p.status === "payment_pending";
      if (!pending) return null;
      return {
        ...paymentCard(p),
        title: p.paymentStatus === "awaiting_extra_payment" ? "Extra Payment" : "Pending Payment",
        dueLabel: p.paymentStatus === "awaiting_extra_payment" ? "Due Now" : "Complete OTP to settle",
      };
    },
    actions: () => [
      action("Show my payment history", { intent: "payment.history" }),
      action("Check my wallet balance", { intent: "wallet.balance" }),
    ],
  },

  "payment.history": {
    async resolve(userId, user) {
      return executeAiTool("get_payment_history", userId, user.role, { limit: 10 });
    },
    async format(data) {
      if (!data.payments || data.payments.length === 0) {
        return "You have **no payments** recorded yet.";
      }
      const lines = data.payments.map(
        (p, i) => `${i + 1}. ${p.description} — ${inr(p.amount)} (${p.status}) — ${formatDate(p.createdAt)}`
      );
      return `Here's your payment history:\n\n${lines.join("\n")}`;
    },
    actions: () => [
      action("Do I have a pending payment?", { intent: "payment.pending" }),
      action("Check my wallet balance", { intent: "wallet.balance" }),
    ],
  },

  "payment.extra": {
    async resolve(userId, user) {
      const active = await executeAiTool("get_active_pickup", userId, user.role, {});
      const pickup = active.pickup || active.pickups?.[0];
      return pickup ? { pickup } : { noPickup: true };
    },
    async format(data) {
      if (data.noPickup) return "There's no active pickup, so no extra payment is due.";
      const p = data.pickup;
      if (p.paymentStatus !== "awaiting_extra_payment") {
        return "Your current pickup **doesn't require an extra payment** — everything is settled.";
      }
      return `Your pickup needs an **extra payment** because the actual weight was more than estimated.\n\nYou can pay it from your **wallet** or **online via Razorpay** directly from the dashboard. Once paid, the collector can complete the pickup with the OTP.`;
    },
    actions: () => [
      action("Show my payment history", { intent: "payment.history" }),
      action("Check my wallet balance", { intent: "wallet.balance" }),
    ],
  },

  "payment.cash": {
    async resolve(userId, user) {
      const active = await executeAiTool("get_active_pickup", userId, user.role, {});
      const pickup = active.pickup || active.pickups?.[0];
      return pickup ? { pickup } : { noPickup: true };
    },
    async format(data) {
      if (data.noPickup) return "You have no active pickup right now.";
      const p = data.pickup;
      if (p.paymentMethod !== "cash") {
        return "Your current pickup is **paid via wallet**, not cash.";
      }
      return `Your current pickup is set to **cash payment**.\n\n- Estimated: ${inr(p.estimatedPrice)}\n- Pay the collector in cash after weighing.\n- The collector confirms cash received, then you share the OTP to complete it.`;
    },
    actions: () => [
      action("What's the status of my pickup?", { intent: "pickup.current" }),
      action("Show my payment history", { intent: "payment.history" }),
    ],
  },

  // ─── Collector ───
  "collector.availability": {
    async resolve(userId, user) {
      if (user.role === "collector") {
        return { me: true, isAvailable: user.isAvailable, updatedAt: user.updatedAt };
      }
      return executeAiTool("get_collector_details", userId, user.role, {});
    },
    async format(data) {
      if (data.me) {
        return `Your availability is currently **${data.isAvailable ? "on (available)" : "off (offline)"}**. Toggle it from your dashboard so nearby residents can find you.`;
      }
      if (!data.collector) return data.message || "No collector assigned yet.";
      return `Your assigned collector is **${data.collector.name}** and is currently **${data.collector.isAvailable ? "available" : "busy"}**.\n\n- Phone: ${data.collector.phone || "—"}\n- Vehicle: ${data.collector.vehicleNumber || "—"}`;
    },
    card(data) {
      if (data.me) {
        return {
          type: "availability",
          title: "Availability",
          isAvailable: data.isAvailable,
          label: data.isAvailable ? "Available" : "Offline",
          updatedAt: data.updatedAt || null,
        };
      }
      if (!data.collector) return null;
      return {
        type: "collector",
        title: "Your Collector",
        name: data.collector.name,
        phone: data.collector.phone || "—",
        vehicleNumber: data.collector.vehicleNumber || "—",
        isAvailable: data.collector.isAvailable,
        pickupStatus: data.pickupStatus,
      };
    },
    actions: (data, user) =>
      user.role === "collector"
        ? [
            action("What pickups are assigned to me?", { intent: "collector.assigned" }),
            action("How much have I earned?", { intent: "collector.earnings" }),
          ]
        : [
            action("Track my pickup on the map", { intent: "pickup.track" }),
            action("How do I contact support?", { intent: "contact.support" }),
          ],
  },

  "collector.navigation": {
    async resolve() {
      return { answer: "You can navigate to your pickup like this:\n\n1. Open the **active pickup** card.\n2. Tap **Track on Map**.\n3. The map shows the route from the collector to your location, with the ETA.\n\nYou'll also get a notification when the collector is almost at your door." };
    },
    format: (data) => data.answer,
    actions: () => [
      action("Track my pickup on the map", { intent: "pickup.track" }),
      action("What's the status of my pickup?", { intent: "pickup.current" }),
    ],
  },

  "collector.assigned": {
    async resolve(userId, user) {
      return executeAiTool("get_active_pickup", userId, user.role, {});
    },
    async format(data) {
      if (!data.hasActivePickup) return "You have **no assigned pickups** right now.";
      if (data.pickup) {
        return `You have an assigned pickup:\n\n- **Status:** ${data.pickup.status.replace(/_/g, " ")}\n- **Waste type:** ${data.pickup.wasteType}\n- **Weight:** ${data.pickup.actualWeight || data.pickup.estimatedWeight} kg\n- **Estimated payout:** ${inr(data.pickup.estimatedPrice)}`;
      }
      return `You have **${data.count} active pickup(s)**.`;
    },
    card(data) {
      if (!data.hasActivePickup) return null;
      const p = data.pickup || data.pickups?.[0];
      return p
        ? { ...pickupCard(p), title: "Assigned Pickup", weight: p.actualWeight || p.estimatedWeight }
        : null;
    },
    actions: () => [
      action("How much have I earned?", { intent: "collector.earnings" }),
      action("What's my current availability?", { intent: "collector.availability" }),
    ],
  },

  "collector.earnings": {
    async resolve(userId, user) {
      if (user.role !== "collector") {
        return { notCollector: true };
      }
      const [wallet, txData] = await Promise.all([
        walletService.getWalletByUser(userId),
        walletService.getTransactions(userId),
      ]);
      const credits = (txData || [])
        .filter((tx) => String(tx.to) === String(userId) && tx.type === "PICKUP_PAYMENT")
        .slice(0, 10);
      return {
        balance: wallet ? wallet.balance - wallet.heldBalance : 0,
        total: wallet ? wallet.balance : 0,
        recent: credits.map((tx) => ({
          amount: tx.amount,
          date: tx.createdAt,
        })),
      };
    },
    async format(data) {
      if (data.notCollector) return "Earnings are available for **collector** accounts.";
      const lines = (data.recent || [])
        .map((r, i) => `${i + 1}. ${inr(r.amount)} — ${formatDate(r.date)}`)
        .join("\n");
      return [
        `Your available balance is **${inr(data.balance)}** (total ${inr(data.total)}).`,
        data.recent.length ? `\nRecent pickup earnings:\n\n${lines}` : "",
        `\nYou can **withdraw** your earnings to your bank account from the Wallet.`,
      ]
        .filter(Boolean)
        .join("");
    },
    card(data) {
      if (data.notCollector) return null;
      return {
        type: "earnings",
        title: "Earnings",
        available: data.balance,
        total: data.total,
        recent: (data.recent || []).slice(0, 5),
      };
    },
    actions: () => [
      action("Check my wallet balance", { intent: "wallet.balance" }),
      action("How do I withdraw my earnings?", { intent: "wallet.withdraw_how" }),
    ],
  },

  // ─── Waste Guide ───
  ...Object.fromEntries(
    Object.entries(guideWaste).map(([key, text]) => [
      `waste.${key}`,
      {
        resolve: async () => ({ answer: text }),
        format: (data) => data.answer,
        actions: () => WASTE_GUIDE_ACTIONS(),
      },
    ])
  ),

  "waste.guide": {
    async resolve() {
      return { answer: "Which waste type would you like to know about? Here's a quick summary:\n\n- **Plastic** → recyclable\n- **Glass** → recyclable\n- **Paper** → recyclable\n- **Metal** → recyclable\n- **Organic** → compostable\n- **Electronic** → recycle responsibly\n- **Hazardous** → handle with care\n\nTap any type below for the full guide." };
    },
    format: (data) => data.answer,
    actions: () => WASTE_GUIDE_ACTIONS(),
  },

  // ─── FAQs ───
  ...Object.fromEntries(
    Object.entries(FAQS).map(([key, text]) => [
      key,
      {
        resolve: async () => ({ answer: text }),
        format: (data) => data.answer,
        actions: () => [
          action("How should I sort my waste?", { intent: "waste.guide" }),
          action("How do I contact support?", { intent: "contact.support" }),
        ],
      },
    ])
  ),

  // ─── Pricing ───
  pricing: {
    async resolve(userId, user) {
      return executeAiTool("get_pricing", userId, user.role, {});
    },
    async format(data) {
      const p = data.pricesPerKg;
      return [
        "Here are the current rates **per kilogram**:",
        "",
        `- Recyclable: ${inr(p.recyclable)}`,
        `- Organic: ${inr(p.organic)}`,
        `- Hazardous: ${inr(p.hazardous)}`,
        `- Electronic: ${inr(p.electronic)}`,
        `- General: ${inr(p.general)}`,
        "",
        "A small buffer is reserved when you create a pickup and adjusted after weighing.",
      ].join("\n");
    },
    actions: () => [
      action("Book a pickup for me", { intent: "pickup.create" }),
      action("How should I sort my waste?", { intent: "waste.guide" }),
    ],
  },

  // ─── Contact Support ───
  "contact.support": {
    async resolve() {
      return { answer: `You can reach FutureBin support anytime:\n\n- **Email:** ${process.env.ADMIN_EMAIL || "support@futurebin.com"}\n\nTell us your **name** and a short description of the issue, and our team will get back to you. For pickup-specific problems, mention the pickup address so we can locate it faster.` };
    },
    format: (data) => data.answer,
    actions: () => [
      action("I need to report a problem with my pickup", { intent: "pickup.report_issue" }),
      action("How does OTP verification work?", { intent: "faq.otp" }),
    ],
  },
};

const summarizePickup = (pickup) => ({
  id: pickup._id,
  status: pickup.status,
  wasteType: pickup.wasteType,
  estimatedWeight: pickup.estimatedWeight,
  actualWeight: pickup.actualWeight || null,
  estimatedPrice: pickup.estimatedPrice,
  finalPrice: pickup.finalPrice || null,
  pickupAddress: pickup.pickupAddress,
  paymentMethod: pickup.paymentMethod,
  paymentStatus: pickup.paymentStatus,
  completedAt: pickup.completedAt,
  cancelledAt: pickup.cancelledAt,
  createdAt: pickup.createdAt,
});

const isSupportedIntent = (intent) => Boolean(INTENT_HANDLERS[intent]);

// ─── Structured response cards ───────────────────────────────────────────────

const walletCard = (data) => ({
  type: "wallet",
  title: "Wallet Balance",
  hasWallet: data.hasWallet,
  balance: data.balance,
  held: data.heldBalance,
  available: data.availableBalance,
  currency: data.currency || "INR",
});

const pickupCard = (p) => ({
  type: "pickup",
  title: "Pickup",
  status: p.status,
  wasteType: p.wasteType,
  address: p.pickupAddress,
  estimatedPrice: p.estimatedPrice,
  finalPrice: p.finalPrice || null,
  estimatedWeight: p.estimatedWeight,
  actualWeight: p.actualWeight || null,
  paymentMethod: p.paymentMethod,
  paymentStatus: p.paymentStatus,
});

const paymentCard = (p) => ({
  type: "payment",
  title: "Payment",
  amount: p.finalPrice || p.estimatedPrice,
  status: p.paymentStatus,
  paymentMethod: p.paymentMethod,
  wasteType: p.wasteType,
  address: p.pickupAddress,
});

const resolveIntent = async (intent, userId, user) => {
  const handler = INTENT_HANDLERS[intent];
  const data = await handler.resolve(userId, user);
  const content = await handler.format(data, user);
  const actions = filterActionsForRole(
    handler.actions ? handler.actions(data, user) : [],
    user.role
  );
  const card = handler.card ? handler.card(data, user) || null : null;

  return { content, actions, card };
};

// ─── Chat entrypoints ────────────────────────────────────────────────────────

const ensureConversation = async (userId, conversationId, firstText) => {
  if (conversationId) {
    if (!isObjectId(conversationId)) {
      const err = new Error("Invalid conversation id");
      err.status = 400;
      throw err;
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: userId,
    });

    if (!conversation) {
      const err = new Error("Conversation not found");
      err.status = 404;
      throw err;
    }

    return conversation;
  }

  const title = firstText?.slice(0, 48) || "New conversation";

  return Conversation.create({ user: userId, title });
};

const saveMessages = async (conversationId, messages) => {
  return Message.insertMany(
    messages.map((m) => ({ conversation: conversationId, ...m }))
  );
};

/**
 * Deterministic guided-action chat (no LLM call).
 * Returns { conversation, userMessage, assistantMessage, suggestedActions }.
 */
export const chatWithIntent = async (userId, user, { conversationId, intent, label }) => {
  if (!isSupportedIntent(intent)) {
    const err = new Error("Unknown action");
    err.status = 400;
    throw err;
  }

  if (!isIntentAllowedForRole(intent, user.role)) {
    const err = new Error(
      "This action isn't available for your account type. Ask me about your own wallet, pickups or earnings instead."
    );
    err.status = 403;
    throw err;
  }

  const userText = sanitizeContent(label || intent);
  const conversation = await ensureConversation(userId, conversationId, userText);

  const { content, actions, card } = await resolveIntent(intent, userId, user);

  const saved = await saveMessages(conversation._id, [
    { role: "user", content: userText || intent },
    { role: "assistant", content, card },
  ]);

  conversation.updatedAt = new Date();
  await conversation.save();

  return {
    conversation,
    userMessage: saved[0],
    assistantMessage: saved[1],
    suggestedActions: actions,
  };
};

/**
 * LLM chat with tool calling. Returns { conversation, userMessage, assistantMessage, suggestedActions }.
 */
export const chatWithAssistant = async (userId, user, { conversationId, content }) => {
  const text = sanitizeContent(content);

  if (!text) {
    const err = new Error("Message is required");
    err.status = 400;
    throw err;
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    const err = new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`);
    err.status = 400;
    throw err;
  }

  const conversation = await ensureConversation(userId, conversationId, text);
  const history = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .lean();
  history.reverse();

  const savedUser = await Message.create({
    conversation: conversation._id,
    role: "user",
    content: text,
  });

  let assistantText = "";
  let toolsUsed = [];

  for await (const event of runAssistantLoop({
    userId,
    user,
    history,
    userContent: text,
  })) {
    if (event.type === "delta") {
      assistantText += event.data.text;
    } else if (event.type === "tool") {
      toolsUsed.push(event.data.name);
    }
  }

  if (!assistantText.trim()) {
    assistantText =
      toolsUsed.length > 0
        ? "Here's the latest information I could find for you."
        : "I'm sorry, I couldn't generate a response right now. Please try again.";
  }

  const savedAssistant = await Message.create({
    conversation: conversation._id,
    role: "assistant",
    content: assistantText.trim(),
    tools: toolsUsed,
  });

  conversation.updatedAt = new Date();
  await conversation.save();

  return {
    conversation,
    userMessage: savedUser,
    assistantMessage: savedAssistant,
    suggestedActions: actionsForTools(toolsUsed, user.role),
  };
};

/**
 * Streaming LLM chat with tool calling.
 * Yields events: { type: "meta" | "delta" | "tool" | "done" | "error", data }
 */
export async function* streamChat(userId, user, { conversationId, content }) {
  let conversation;
  let userMessage;
  let assistantMessage;

  try {
    const text = sanitizeContent(content);

    if (!text) throw Object.assign(new Error("Message is required"), { status: 400 });
    if (text.length > MAX_MESSAGE_LENGTH) {
      throw Object.assign(new Error(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`), { status: 400 });
    }

    conversation = await ensureConversation(userId, conversationId, text);

    const history = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .lean();
    history.reverse();

    userMessage = await Message.create({
      conversation: conversation._id,
      role: "user",
      content: text,
    });

    yield { type: "meta", data: { conversationId: conversation._id, userMessageId: userMessage._id } };

    let assistantText = "";
    const toolsUsed = [];

    for await (const event of runAssistantLoop({
      userId,
      user,
      history,
      userContent: text,
    })) {
      if (event.type === "delta") {
        assistantText += event.data.text;
        yield event;
      } else if (event.type === "tool") {
        toolsUsed.push(event.data.name);
        yield event;
      }
    }

    if (!assistantText.trim()) {
      assistantText =
        toolsUsed.length > 0
          ? "Here's the latest information I could find for you."
          : "I'm sorry, I couldn't generate a response right now. Please try again.";
    }

    assistantMessage = await Message.create({
      conversation: conversation._id,
      role: "assistant",
      content: assistantText.trim(),
      tools: toolsUsed,
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    yield {
      type: "done",
      data: {
        conversationId: conversation._id,
        userMessage,
        assistantMessage,
        suggestedActions: actionsForTools(toolsUsed, user.role),
      },
    };
  } catch (error) {
    yield {
      type: "error",
      data: {
        message: error.message || "Something went wrong",
        status: error.status || 500,
      },
    };
  }
}

// ─── LLM Loop with Tool Calling ──────────────────────────────────────────────

const runAssistantLoop = async function* ({ userId, user, history, userContent }) {
  const client = getAIClient();
  const model = getAIModel();

  const messages = [
    { role: "system", content: await buildSystemPrompt(user) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userContent },
  ];

  let rounds = 0;

  while (rounds < MAX_ROUNDS) {
    rounds += 1;

    const stream = await client.chat.completions.create({
      model,
      messages,
      tools: TOOL_DEFINITIONS,
      stream: true,
      max_tokens: Number(process.env.AI_MAX_TOKENS) || 1024,
      temperature: 0.7,
    });

    const toolCalls = [];
    let textDelta = "";
    let finishReason = null;

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      if (!choice) continue;

      finishReason = choice.finish_reason || finishReason;

      const delta = choice.delta;
      if (delta?.content) {
        textDelta += delta.content;
        yield { type: "delta", data: { text: delta.content } };
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          toolCalls[idx] = toolCalls[idx] || { id: null, name: "", argsText: "" };
          if (tc.id) toolCalls[idx].id = tc.id;
          if (tc.function?.name) toolCalls[idx].name += tc.function.name;
          if (tc.function?.arguments) toolCalls[idx].argsText += tc.function.arguments;
        }
      }
    }

    if (finishReason === "tool_calls" && toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: textDelta || null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.argsText },
        })),
      });

      for (const tc of toolCalls) {
        let parsed = {};
        try {
          parsed = tc.argsText ? JSON.parse(tc.argsText) : {};
        } catch {
          parsed = {};
        }

        const result = await executeAiTool(tc.name, userId, user.role, parsed);
        yield { type: "tool", data: { name: tc.name } };
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      continue;
    }

    break;
  }
};

export default {
  createConversation,
  listConversations,
  getConversationMessages,
  deleteConversation,
  chatWithIntent,
  chatWithAssistant,
  streamChat,
  getAIClient,
};
