import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import PickupRequest from "../models/PickupRequest.js";
import User from "../models/User.js";
import { createPickupRequest } from "./pickupService.js";
import { getWastePrices } from "./settingService.js";
import {
  sendSubscriptionCreatedEmail,
  sendSubscriptionInsufficientBalanceEmail,
  sendSubscriptionPickupSkippedEmail,
} from "../utils/sendEmail.js";
import {
  computeInitialNextRunAt,
  computeNextRunAt,
  formatInTimezone,
  getDayName,
} from "../utils/subscriptionScheduler.js";

const SUBSCRIPTION_ACTIVE_PICKUP_STATUSES = [
  "pending",
  "broadcasting",
  "accepted",
  "collector_arrived",
  "weight_verified",
  "awaiting_extra_payment",
];

const validateSubscriptionInput = async (data) => {
  const {
    frequency,
    dayOfWeek,
    dayOfMonth,
    pickupTime,
    timezone,
    wasteType,
    estimatedWeight,
    address,
    location,
    paymentMethod,
  } = data;

  if (!frequency || !["weekly", "monthly"].includes(frequency)) {
    throw new Error("Frequency must be 'weekly' or 'monthly'");
  }

  if (frequency === "weekly") {
    if (dayOfWeek === undefined || dayOfWeek === null || dayOfWeek === "") {
      throw new Error("dayOfWeek is required for weekly subscriptions");
    }
    const dow = Number(dayOfWeek);
    if (isNaN(dow) || dow < 0 || dow > 6 || !Number.isInteger(dow)) {
      throw new Error("dayOfWeek must be an integer between 0 and 6");
    }
  }

  if (frequency === "monthly") {
    if (dayOfMonth === undefined || dayOfMonth === null || dayOfMonth === "") {
      throw new Error("dayOfMonth is required for monthly subscriptions");
    }
    const dom = Number(dayOfMonth);
    if (isNaN(dom) || dom < 1 || dom > 31 || !Number.isInteger(dom)) {
      throw new Error("dayOfMonth must be an integer between 1 and 31");
    }
  }

  if (frequency === "weekly" && dayOfMonth !== undefined && dayOfMonth !== null && dayOfMonth !== "") {
    throw new Error("Weekly subscriptions cannot have dayOfMonth set");
  }

  if (frequency === "monthly" && dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek !== "") {
    throw new Error("Monthly subscriptions cannot have dayOfWeek set");
  }

  if (!pickupTime || !/^\d{2}:\d{2}$/.test(pickupTime)) {
    throw new Error("pickupTime must be in HH:mm format");
  }

  const [h, m] = pickupTime.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error("pickupTime contains invalid hours or minutes");
  }

  if (!timezone) {
    throw new Error("timezone is required");
  }

  if (!wasteType) {
    throw new Error("wasteType is required");
  }

  const prices = await getWastePrices();
  if (!prices[wasteType]) {
    throw new Error(`Invalid waste type: ${wasteType}`);
  }

  if (!estimatedWeight || Number(estimatedWeight) <= 0) {
    throw new Error("estimatedWeight must be greater than 0");
  }

  if (!address || (!address.full && !address.street)) {
    throw new Error("address with at least a full address or street is required");
  }

  if (
    !location ||
    !location.coordinates ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    throw new Error("location with valid coordinates [lng, lat] is required");
  }

  const [lng, lat] = location.coordinates;
  if (Number(lng) < -180 || Number(lng) > 180 || Number(lat) < -90 || Number(lat) > 90) {
    throw new Error("Coordinates are out of valid range");
  }

  if (!paymentMethod || !["wallet", "cash"].includes(paymentMethod)) {
    throw new Error("paymentMethod must be 'wallet' or 'cash'");
  }
};

export const createSubscription = async (data, residentId) => {
  await validateSubscriptionInput(data);

  const existingActive = await Subscription.findOne({
    resident: residentId,
    frequency: data.frequency,
    dayOfWeek: data.frequency === "weekly" ? Number(data.dayOfWeek) : null,
    dayOfMonth: data.frequency === "monthly" ? Number(data.dayOfMonth) : null,
    wasteType: data.wasteType,
    status: "active",
  });

  if (existingActive) {
    const err = new Error(
      `An active ${data.frequency} subscription for this schedule and waste type already exists`
    );
    err.status = 409;
    throw err;
  }

  const subscriptionData = {
    resident: residentId,
    frequency: data.frequency,
    dayOfWeek: data.frequency === "weekly" ? Number(data.dayOfWeek) : null,
    dayOfMonth: data.frequency === "monthly" ? Number(data.dayOfMonth) : null,
    pickupTime: data.pickupTime,
    timezone: data.timezone || "UTC",
    wasteType: data.wasteType,
    estimatedWeight: Number(data.estimatedWeight),
    address: data.address,
    location: {
      type: "Point",
      coordinates: data.location.coordinates.map(Number),
    },
    images: data.images || [],
    paymentMethod: data.paymentMethod,
    status: "active",
  };

  const tempSub = new Subscription(subscriptionData);
  tempSub.nextRunAt = computeInitialNextRunAt(tempSub);

  let subscription;
  try {
    subscription = await Subscription.create(tempSub);
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error(
        `An active ${data.frequency} subscription for this schedule and waste type already exists`
      );
      err.status = 409;
      throw err;
    }
    throw error;
  }

  try {
    const resident = await User.findById(residentId).select("name email");
    if (resident) {
      const nextRunFormatted = formatInTimezone(
        subscription.nextRunAt,
        subscription.timezone
      );
      await sendSubscriptionCreatedEmail(
        resident.email,
        resident.name,
        subscription.frequency,
        subscription.wasteType,
        nextRunFormatted
      );
    }
  } catch {
    // email failure should not break subscription creation
  }

  return subscription;
};

export const getSubscriptionsByResident = async (residentId) => {
  return await Subscription.find({ resident: residentId })
    .sort({ createdAt: -1 })
    .populate("lastPickupRequest", "status completedAt estimatedPrice");
};

export const getSubscriptionById = async (subscriptionId, residentId) => {
  const subscription = await Subscription.findById(subscriptionId)
    .populate("lastPickupRequest", "status completedAt estimatedPrice pickupAddress");

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (String(subscription.resident) !== String(residentId)) {
    const err = new Error("Not authorized to access this subscription");
    err.status = 403;
    throw err;
  }

  return subscription;
};

export const editSubscription = async (subscriptionId, residentId, updates) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (String(subscription.resident) !== String(residentId)) {
    const err = new Error("Not authorized to modify this subscription");
    err.status = 403;
    throw err;
  }

  if (subscription.status !== "active" && subscription.status !== "paused") {
    const err = new Error("Cannot edit a cancelled subscription");
    err.status = 409;
    throw err;
  }

  if (subscription.processingLock) {
    const err = new Error("Subscription is currently being processed. Please try again shortly.");
    err.status = 409;
    throw err;
  }

  const editableFields = [
    "wasteType", "estimatedWeight", "address", "location",
    "images", "paymentMethod", "frequency", "pickupTime",
    "timezone", "dayOfWeek", "dayOfMonth",
  ];

  let schedulingChanged = false;

  for (const field of editableFields) {
    if (updates[field] !== undefined) {
      if (field === "dayOfWeek") {
        subscription.dayOfWeek = updates.frequency === "monthly" ? null : Number(updates[field]);
      } else if (field === "dayOfMonth") {
        subscription.dayOfMonth = updates.frequency === "weekly" ? null : Number(updates[field]);
      } else if (field === "location" && updates[field]?.coordinates) {
        subscription.location = {
          type: "Point",
          coordinates: updates[field].coordinates.map(Number),
        };
      } else if (field === "address") {
        subscription.address = updates[field];
      } else if (field === "estimatedWeight") {
        subscription.estimatedWeight = Number(updates[field]);
      } else if (field === "images") {
        subscription.images = updates[field] || [];
      } else {
        subscription[field] = updates[field];
      }

      if (["frequency", "pickupTime", "timezone", "dayOfWeek", "dayOfMonth"].includes(field)) {
        schedulingChanged = true;
      }
    }
  }

  if (schedulingChanged) {
    if (subscription.frequency === "weekly" && subscription.dayOfWeek === null && updates.dayOfWeek !== undefined) {
      subscription.dayOfWeek = Number(updates.dayOfWeek);
    }
    if (subscription.frequency === "monthly" && subscription.dayOfMonth === null && updates.dayOfMonth !== undefined) {
      subscription.dayOfMonth = Number(updates.dayOfMonth);
    }
    subscription.nextRunAt = computeInitialNextRunAt(subscription);
  }

  await subscription.save();
  return subscription;
};

export const pauseSubscription = async (subscriptionId, residentId) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (String(subscription.resident) !== String(residentId)) {
    const err = new Error("Not authorized to modify this subscription");
    err.status = 403;
    throw err;
  }

  if (subscription.status !== "active") {
    throw new Error("Only active subscriptions can be paused");
  }

  subscription.status = "paused";
  await subscription.save();
  return subscription;
};

export const resumeSubscription = async (subscriptionId, residentId) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (String(subscription.resident) !== String(residentId)) {
    const err = new Error("Not authorized to modify this subscription");
    err.status = 403;
    throw err;
  }

  if (subscription.status !== "paused") {
    throw new Error("Only paused subscriptions can be resumed");
  }

  subscription.status = "active";
  subscription.nextRunAt = computeInitialNextRunAt(subscription);
  await subscription.save();
  return subscription;
};

export const cancelSubscription = async (subscriptionId, residentId) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (String(subscription.resident) !== String(residentId)) {
    const err = new Error("Not authorized to modify this subscription");
    err.status = 403;
    throw err;
  }

  if (subscription.status === "cancelled") {
    throw new Error("Subscription is already cancelled");
  }

  subscription.status = "cancelled";
  await subscription.save();
  return subscription;
};

export const deleteSubscription = async (subscriptionId, residentId) => {
  const subscription = await Subscription.findById(subscriptionId);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  if (String(subscription.resident) !== String(residentId)) {
    const err = new Error("Not authorized to delete this subscription");
    err.status = 403;
    throw err;
  }

  if (subscription.status !== "cancelled") {
    throw new Error("Only cancelled subscriptions can be deleted");
  }

  await Subscription.findByIdAndDelete(subscriptionId);
  return { message: "Subscription deleted successfully" };
};

export const hasActivePickupForSubscription = async (subscriptionId) => {
  return await PickupRequest.findOne({
    subscriptionId,
    status: { $in: SUBSCRIPTION_ACTIVE_PICKUP_STATUSES },
  }).select("_id status");
};

export const getAllSubscriptionsForAdmin = async () => {
  return await Subscription.find()
    .sort({ createdAt: -1 })
    .populate("resident", "name email")
    .populate("lastPickupRequest", "status completedAt estimatedPrice");
};

export const getSubscriptionStats = async () => {
  const [
    total,
    weekly,
    monthly,
    active,
    paused,
    cancelled,
    generatedPickups,
  ] = await Promise.all([
    Subscription.countDocuments(),
    Subscription.countDocuments({ frequency: "weekly" }),
    Subscription.countDocuments({ frequency: "monthly" }),
    Subscription.countDocuments({ status: "active" }),
    Subscription.countDocuments({ status: "paused" }),
    Subscription.countDocuments({ status: "cancelled" }),
    PickupRequest.countDocuments({ subscriptionId: { $ne: null } }),
  ]);

  const failedPickups = await Subscription.aggregate([
    { $match: { consecutiveFailures: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: "$consecutiveFailures" } } },
  ]);

  return {
    totalSubscriptions: total,
    weeklySubscriptions: weekly,
    monthlySubscriptions: monthly,
    activeSubscriptions: active,
    pausedSubscriptions: paused,
    cancelledSubscriptions: cancelled,
    generatedPickups,
    walletFailures: failedPickups[0]?.total || 0,
  };
};
