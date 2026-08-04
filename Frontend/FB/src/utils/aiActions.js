import { ROLES } from "./constants";

export const INTENT_ROLES = {
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

export const isActionAllowedForRole = (action, role) =>
  !action?.intent || (INTENT_ROLES[action.intent] || []).includes(role);

export const filterActionsForRole = (actions, role) =>
  (actions || []).filter((action) => isActionAllowedForRole(action, role));

// ─── Welcome prompt suggestions (role-aware) ─────────────────────────────────

export const PROMPT_SUGGESTIONS = {
  [ROLES.RESIDENT]: [
    { label: "Book a pickup for me", intent: "pickup.create", emoji: "📦" },
    { label: "What's my wallet balance?", intent: "wallet.balance", emoji: "💰" },
    { label: "Is there a payment pending?", intent: "payment.pending", emoji: "🧾" },
    { label: "How should I sort my waste?", intent: "waste.guide", emoji: "♻️" },
    { label: "What's my subscription status?", intent: "subscription.view", emoji: "🔄" },
    { label: "Show my past pickups", intent: "pickup.history", emoji: "📋" },
    { label: "Rate collector", prompt: "How do I rate my collector?", emoji: "⭐" },
    { label: "Notifications", prompt: "Do I have any notifications?", emoji: "🔔" },
  ],
  [ROLES.COLLECTOR]: [
    { label: "What pickups are assigned to me?", intent: "collector.assigned", emoji: "📦" },
    { label: "How much have I earned?", intent: "collector.earnings", emoji: "📈" },
    { label: "What's my wallet balance?", intent: "wallet.balance", emoji: "💰" },
    { label: "Is there a payment pending?", intent: "payment.pending", emoji: "🧾" },
    { label: "Am I available for pickups?", intent: "collector.availability", emoji: "📍" },
    { label: "How do I withdraw my earnings?", intent: "wallet.withdraw_how", emoji: "🏦" },
    { label: "Customer reviews", prompt: "What do my customer reviews look like?", emoji: "⭐" },
    { label: "Route optimization", prompt: "How can I optimize my pickup routes?", emoji: "🗺️" },
  ],
  [ROLES.ADMIN]: [
    { label: "How should I sort my waste?", intent: "waste.guide", emoji: "♻️" },
    { label: "What are the current pickup rates?", intent: "pricing", emoji: "💰" },
    { label: "What's my wallet balance?", intent: "wallet.balance", emoji: "👛" },
    { label: "How do I contact support?", intent: "contact.support", emoji: "💬" },
  ],
};

export const getPromptSuggestionsForRole = (role) =>
  PROMPT_SUGGESTIONS[role] || [];
