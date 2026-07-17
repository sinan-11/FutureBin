import crypto from "crypto";
import PickupRequest from "../models/PickupRequest.js";
import User from "../models/User.js";
import { sendPickupOtp, sendPickupCompletedToResident, sendPickupCompletedToCollector } from "../utils/sendEmail.js";
import { getWastePrices } from "./settingService.js";

const SEARCH_RADIUS = Number(process.env.PICKUP_SEARCH_RADIUS) || 5000;
const EXPIRY_MINUTES = Number(process.env.PICKUP_EXPIRY_MINUTES) || 30;

const VALID_TRANSITIONS = {
  broadcasting: ["accepted", "cancelled", "expired"],
  accepted: ["collector_arrived", "cancelled"],
  collector_arrived: ["weight_verified"],
  weight_verified: ["completed"],
};

const ACTIVE_STATUSES = [
  "accepted",
  "collector_arrived",
  "collecting",
  "weight_verified",
  "payment_pending",
  "paid",
];

export const hasActivePickup = async (collectorId) => {
  const count = await PickupRequest.countDocuments({
    collector: collectorId,
    status: { $in: ACTIVE_STATUSES },
  });
  return count > 0;
};

const STATUS_TIMESTAMPS = {
  accepted: "acceptedAt",
  collector_arrived: "arrivedAt",
  completed: "completedAt",
  cancelled: "cancelledAt",
};

export const calculatePrice = async (weight, wasteType) => {
  const prices = await getWastePrices();
  const rate = prices[wasteType] || prices.defaultRate;
  return Math.round(weight * rate * 100) / 100;
};

export const findNearbyCollectors = async (
  coordinates,
  maxDistance = SEARCH_RADIUS
) => {
  const collectors = await User.find({
    role: "collector",
    isApproved: true,
    isAvailable: true,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: maxDistance,
      },
    },
  })
    .select("_id name location")
    .limit(10);

  return collectors;
};

export const createPickupRequest = async (data, residentId) => {
  const {
    wasteType,
    estimatedWeight,
    pickupAddress,
    coordinates,
    description,
    images,
    scheduledAt,
  } = data;

  const estimatedPrice = await calculatePrice(estimatedWeight, wasteType);

  const request = await PickupRequest.create({
    resident: residentId,
    wasteType,
    estimatedWeight,
    estimatedPrice,
    description: description || "",
    images: images || [],
    pickupAddress,
    location: {
      type: "Point",
      coordinates,
    },
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    status: "broadcasting",
  });

  const nearbyCollectors = await findNearbyCollectors(coordinates);
  const collectorIds = nearbyCollectors.map((c) => c._id);

  if (collectorIds.length > 0) {
    request.eligibleCollectors = collectorIds;
    await request.save();
  }

  return {
    request,
    nearbyCollectors: collectorIds,
  };
};

export const acceptPickupRequest = async (requestId, collectorId) => {
  const active = await hasActivePickup(collectorId);
  if (active) {
    throw new Error(
      "You already have an active pickup. Complete it before accepting another request."
    );
  }

  const request = await PickupRequest.findOneAndUpdate(
    {
      _id: requestId,
      status: "broadcasting",
      collector: null,
    },
    {
      $set: {
        status: "accepted",
        collector: collectorId,
        acceptedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!request) {
    const existing = await PickupRequest.findById(requestId);

    if (!existing) {
      throw new Error("Pickup request not found");
    }

    throw new Error(
      "This request has already been accepted by another collector"
    );
  }

  return request;
};

export const getResidentRequests = async (residentId) => {
  const requests = await PickupRequest.find({ resident: residentId })
    .populate("collector", "name collectorDetails.phone")
    .sort({ createdAt: -1 });

  const current = requests.filter(
    (r) =>
      r.status === "broadcasting" ||
      r.status === "accepted" ||
      r.status === "collector_arrived" ||
      r.status === "collecting" ||
      r.status === "weight_verified" ||
      r.status === "payment_pending" ||
      r.status === "paid"
  );

  const completed = requests.filter(
    (r) => r.status === "completed"
  );

  const cancelled = requests.filter(
    (r) => r.status === "cancelled" || r.status === "expired"
  );

  return { current, completed, cancelled };
};

export const getCollectorRequests = async (collectorId) => {
  const requests = await PickupRequest.find({
    collector: collectorId,
    status: {
      $in: [
        "accepted",
        "collector_arrived",
        "collecting",
        "weight_verified",
        "payment_pending",
        "paid",
        "completed",
      ],
    },
  })
    .populate("resident", "name email")
    .sort({ createdAt: -1 });

  const active = requests.filter(
    (r) =>
      r.status === "accepted" ||
      r.status === "collector_arrived" ||
      r.status === "collecting" ||
      r.status === "weight_verified" ||
      r.status === "payment_pending" ||
      r.status === "paid"
  );

  const completed = requests.filter(
    (r) => r.status === "completed"
  );

  return { active, completed };
};

export const rejectPickupRequest = async (requestId, collectorId) => {
  const request = await PickupRequest.findOneAndUpdate(
    {
      _id: requestId,
      status: "broadcasting",
      rejectedBy: { $ne: collectorId },
    },
    {
      $addToSet: { rejectedBy: collectorId },
    },
    { new: true }
  );

  if (!request) {
    const existing = await PickupRequest.findById(requestId);

    if (!existing) {
      throw new Error("Pickup request not found");
    }

    throw new Error("You have already rejected this request");
  }

  return request;
};

export const getAvailableRequests = async (collectorId) => {
  const filter = { status: "broadcasting" };

  if (collectorId) {
    filter.rejectedBy = { $ne: collectorId };
  }

  const requests = await PickupRequest.find(filter)
    .populate("resident", "name email")
    .sort({ createdAt: -1 });

  return requests;
};

export const updateRequestStatus = async (
  requestId,
  collectorId,
  newStatus
) => {
  const request = await PickupRequest.findById(requestId);

  if (!request) {
    throw new Error("Pickup request not found");
  }

  if (!request.collector || request.collector.toString() !== collectorId) {
    throw new Error(
      "You are not the assigned collector for this request"
    );
  }

  const allowedNext = VALID_TRANSITIONS[request.status];

  if (!allowedNext || !allowedNext.includes(newStatus)) {
    throw new Error(
      `Cannot transition from "${request.status}" to "${newStatus}"`
    );
  }

  const updateFields = { status: newStatus };

  const timestampField = STATUS_TIMESTAMPS[newStatus];

  if (timestampField) {
    updateFields[timestampField] = new Date();
  }

  const updated = await PickupRequest.findByIdAndUpdate(
    requestId,
    { $set: updateFields },
    { new: true }
  );

  return updated;
};

export const cancelRequest = async (requestId, residentId) => {
  const request = await PickupRequest.findOne({
    _id: requestId,
    resident: residentId,
  });

  if (!request) {
    throw new Error("Pickup request not found");
  }

  if (
    request.status !== "broadcasting" &&
    request.status !== "accepted"
  ) {
    throw new Error(
      `Cannot cancel request in "${request.status}" status`
    );
  }

  const collectorId = request.collector;

  request.status = "cancelled";
  request.cancelledAt = new Date();
  request.collector = null;

  await request.save();

  return { request, collectorId };
};

const notifyPickupOtp = async (resident, otp, pickupAddress) => {
  try {
    await sendPickupOtp(resident.email, otp, pickupAddress);
    console.log(`[NOTIFY] OTP sent to ${resident.email} for pickup`);
  } catch (error) {
    console.error(`[NOTIFY] Failed to send OTP email: ${error.message}`);
  }
};

export const arriveAtPickup = async (requestId, collectorId) => {
  const request = await PickupRequest.findOneAndUpdate(
    {
      _id: requestId,
      collector: collectorId,
      status: "accepted",
    },
    {
      $set: {
        status: "collector_arrived",
        arrivedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!request) {
    const existing = await PickupRequest.findById(requestId);
    if (!existing) throw new Error("Pickup request not found");
    throw new Error("Cannot mark arrival in the current status");
  }

  return request;
};

export const verifyActualWeight = async (requestId, collectorId, actualWeight) => {
  if (!actualWeight || Number(actualWeight) <= 0) {
    throw new Error("Actual weight must be greater than 0");
  }

  const request = await PickupRequest.findOne({
    _id: requestId,
    collector: collectorId,
    status: "collector_arrived",
  });

  if (!request) {
    const existing = await PickupRequest.findById(requestId);
    if (!existing) throw new Error("Pickup request not found");
    throw new Error("Cannot verify weight in the current status");
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  request.actualWeight = Number(actualWeight);
  request.finalAmount = await calculatePrice(Number(actualWeight), request.wasteType);
  request.status = "weight_verified";
  request.completionOtp = otp;
  request.completionOtpExpiresAt = expiresAt;
  request.otpAttempts = 0;

  await request.save();

  const resident = await User.findById(request.resident);
  if (resident) {
    await notifyPickupOtp(resident, otp, request.pickupAddress);
  }

  const result = request.toObject();

  if (process.env.NODE_ENV !== "production") {
    result.otp = otp;
  }

  return result;
};

export const generateCompletionOtp = async (requestId, collectorId) => {
  const request = await PickupRequest.findOne({
    _id: requestId,
    collector: collectorId,
    status: "weight_verified",
  });

  if (!request) {
    const existing = await PickupRequest.findById(requestId);
    if (!existing) throw new Error("Pickup request not found");
    throw new Error("Cannot generate OTP in the current status");
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  request.completionOtp = otp;
  request.completionOtpExpiresAt = expiresAt;
  request.otpAttempts = 0;
  await request.save();

  const resident = await User.findById(request.resident);
  if (resident) {
    await notifyPickupOtp(resident, otp, request.pickupAddress);
  }

  const result = request.toObject();

  if (process.env.NODE_ENV !== "production") {
    result.otp = otp;
  }

  return result;
};

export const regenerateCompletionOtp = async (requestId, residentId) => {
  const request = await PickupRequest.findOne({
    _id: requestId,
    resident: residentId,
    status: "weight_verified",
  });

  if (!request) {
    const existing = await PickupRequest.findById(requestId);
    if (!existing) throw new Error("Pickup request not found");
    throw new Error("Cannot generate OTP in the current status");
  }

  const otp = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  request.completionOtp = otp;
  request.completionOtpExpiresAt = expiresAt;
  request.otpAttempts = 0;
  await request.save();

  const resident = await User.findById(request.resident);
  if (resident) {
    await notifyPickupOtp(resident, otp, request.pickupAddress);
  }

  return { otp };
};

export const getPickupOtp = async (requestId, residentId) => {
  const request = await PickupRequest.findOne({
    _id: requestId,
    resident: residentId,
    status: "weight_verified",
    completionOtp: { $ne: null },
  });

  if (!request) {
    throw new Error("OTP not found or request is not awaiting verification");
  }

  return { otp: request.completionOtp };
};

export const verifyCompletionOtp = async (requestId, collectorId, otp) => {
  const matched = await PickupRequest.findOneAndUpdate(
    {
      _id: requestId,
      collector: collectorId,
      status: "weight_verified",
      completionOtp: otp,
      completionOtpExpiresAt: { $gt: new Date() },
    },
    {
      $set: {
        status: "completed",
        completedAt: new Date(),
        otpVerified: true,
        completionOtp: null,
        completionOtpExpiresAt: null,
        otpAttempts: 0,
        // TODO: Debit resident wallet
        // TODO: Credit collector wallet
        // TODO: Create wallet transactions
      },
    },
    { new: true }
  );

  if (!matched) {
    const updated = await PickupRequest.findOneAndUpdate(
      {
        _id: requestId,
        collector: collectorId,
        status: "weight_verified",
        completionOtp: { $ne: null },
      },
      { $inc: { otpAttempts: 1 } },
      { new: true }
    );

    if (!updated) {
      throw new Error("Pickup request not found or invalid state");
    }

    if (updated.otpAttempts >= 5) {
      await PickupRequest.findByIdAndUpdate(requestId, {
        $set: {
          completionOtp: null,
          completionOtpExpiresAt: null,
          otpAttempts: 0,
        },
      });
      throw new Error("Maximum OTP attempts exceeded. Please generate a new OTP.");
    }

    throw new Error("Invalid OTP");
  }

  try {
    const completed = await PickupRequest.findById(requestId).lean();

    if (completed) {
      const [resident, collector] = await Promise.all([
        User.findById(completed.resident).select("name email"),
        User.findById(completed.collector).select("name email"),
      ]);

      const sendTo = [];

      if (resident?.email) {
        sendTo.push(
          sendPickupCompletedToResident(
            resident.email,
            resident.name,
            completed.pickupAddress,
            completed.actualWeight,
            completed.finalAmount,
            collector?.name || "Collector"
          )
        );
      }

      if (collector?.email) {
        sendTo.push(
          sendPickupCompletedToCollector(
            collector.email,
            collector.name,
            completed.pickupAddress,
            completed.actualWeight,
            completed.finalAmount,
            resident?.name || "Resident"
          )
        );
      }

      await Promise.allSettled(sendTo);
    }
  } catch (e) {
    console.error("Failed to send completion emails:", e);
  }

  return await PickupRequest.findById(requestId);
};

export const expireStaleRequests = async () => {
  const cutoff = new Date(
    Date.now() - EXPIRY_MINUTES * 60 * 1000
  );

  const staleRequests = await PickupRequest.find({
    status: "broadcasting",
    createdAt: { $lt: cutoff },
  }).select("_id resident eligibleCollectors");

  if (staleRequests.length === 0) {
    return { count: 0, expiredRequests: [] };
  }

  await PickupRequest.updateMany(
    {
      _id: { $in: staleRequests.map((r) => r._id) },
    },
    {
      $set: {
        status: "expired",
      },
    }
  );

  return {
    count: staleRequests.length,
    expiredRequests: staleRequests,
  };
};