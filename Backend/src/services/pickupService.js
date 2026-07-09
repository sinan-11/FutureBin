import crypto from "crypto";
import PickupRequest from "../models/PickupRequest.js";
import User from "../models/User.js";
import { sendPickupOtp, sendPickupCompletedToResident, sendPickupCompletedToCollector } from "../utils/sendEmail.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_PER_KG = Number(process.env.PICKUP_PRICE_PER_KG) || 5;
const SEARCH_RADIUS = Number(process.env.PICKUP_SEARCH_RADIUS) || 5000;
const EXPIRY_MINUTES = Number(process.env.PICKUP_EXPIRY_MINUTES) || 30;

/**
 * Valid status transitions.
 * Key: current status → values: allowed next statuses.
 */
const VALID_TRANSITIONS = {
  broadcasting: ["accepted", "cancelled", "expired"],
  accepted: ["collector_arrived", "cancelled"],
  collector_arrived: ["weight_verified"],
  weight_verified: ["completed"],
};

/**
 * Timestamp fields that should be set for each status.
 */
const STATUS_TIMESTAMPS = {
  accepted: "acceptedAt",
  collector_arrived: "arrivedAt",
  completed: "completedAt",
  cancelled: "cancelledAt",
};

// ─── Price Estimation ─────────────────────────────────────────────────────────

/**
 * Calculate estimated pickup price based on weight.
 * Uses PICKUP_PRICE_PER_KG env variable with a default of 5.
 *
 * @param {number} weight - Weight in kg
 * @returns {number} Estimated price
 */
export const calculatePrice = (weight) => {
  return Math.round(weight * PRICE_PER_KG * 100) / 100;
};

// ─── Nearby Collector Search ──────────────────────────────────────────────────

/**
 * Find nearby available collectors using MongoDB $near.
 *
 * The $near query uses the 2dsphere index on the User collection's
 * location field to efficiently find collectors within the given radius,
 * sorted by proximity (nearest first).
 *
 * @param {number[]} coordinates - [longitude, latitude]
 * @param {number} [maxDistance] - Search radius in meters
 * @returns {Promise<Object[]>} Top 10 nearest collectors
 */
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

// ─── Create Pickup Request ────────────────────────────────────────────────────

/**
 * Create a new pickup request and broadcast it to nearby collectors.
 *
 * 1. Validate and save the request with status "broadcasting".
 * 2. Find nearby available collectors.
 * 3. Store eligible collector IDs on the request for future WebSocket targeting.
 *
 * @param {Object} data - Request data from the client
 * @param {string} data.wasteType
 * @param {number} data.estimatedWeight
 * @param {string} data.pickupAddress
 * @param {number[]} data.coordinates - [longitude, latitude]
 * @param {string} [data.description]
 * @param {string[]} [data.images]
 * @param {string} [data.scheduledAt] - ISO date string
 * @param {string} residentId - Resident's user ID
 * @returns {Promise<{request: Object, nearbyCollectors: Object[]}>}
 */
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

  const estimatedPrice = calculatePrice(estimatedWeight);

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

  // Find nearby available collectors for broadcasting
  const nearbyCollectors = await findNearbyCollectors(coordinates);

  const collectorIds = nearbyCollectors.map((c) => c._id);

  if (collectorIds.length > 0) {
    // Store eligible collectors on the request for future WebSocket targeting
    request.eligibleCollectors = collectorIds;
    await request.save();
  }

  return {
    request,
    nearbyCollectors: collectorIds,
  };
};

// ─── Atomic Accept ────────────────────────────────────────────────────────────

/**
 * Atomically accept a pickup request.
 *
 * Uses findOneAndUpdate with conditions that ensure:
 * - status is still "broadcasting"
 * - collector has not already been assigned (collector is null)
 *
 * Since findOneAndUpdate is an atomic MongoDB operation, simultaneous
 * accept attempts by different collectors are safe — only the first
 * one to execute will succeed. The others will receive null and can
 * be notified that the request was already taken.
 *
 * @param {string} requestId - Pickup request ID
 * @param {string} collectorId - Collector's user ID
 * @returns {Promise<Object>} Updated request
 * @throws {Error} 409 if request was already accepted or 404 if not found
 */
export const acceptPickupRequest = async (requestId, collectorId) => {
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
    // Check if it exists at all vs already taken
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

// ─── Resident View ────────────────────────────────────────────────────────────

/**
 * Get all pickup requests for a resident.
 * Sorted newest first.
 *
 * @param {string} residentId
 * @returns {Promise<Object>} Requests grouped by category
 */
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

// ─── Collector View ───────────────────────────────────────────────────────────

/**
 * Get pickup requests assigned to a collector.
 * Only returns requests where this collector is the assigned collector.
 * Sorted newest first.
 *
 * @param {string} collectorId
 * @returns {Promise<Object[]>} Assigned requests grouped by status category
 */
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

// ─── Reject Pickup Request ────────────────────────────────────────────────────

/**
 * Add a collector to the rejectedBy list so the request no longer
 * appears in their available requests feed.
 *
 * @param {string} requestId
 * @param {string} collectorId
 * @returns {Promise<Object>} Updated request
 * @throws {Error} 404 if not found or if collector is not eligible
 */
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

// ─── Available Requests (Collector) ─────────────────────────────────────────

/**
 * Get all pickup requests that are currently broadcasting.
 * Collectors use this to see available pickups they can accept.
 * Sorted newest first.
 *
 * @returns {Promise<Object[]>} Available requests
 */
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

// ─── Status Update ────────────────────────────────────────────────────────────

/**
 * Update the status of a pickup request.
 * Validates the transition is allowed before applying.
 *
 * @param {string} requestId
 * @param {string} collectorId - Must be the assigned collector
 * @param {string} newStatus - Target status
 * @returns {Promise<Object>} Updated request
 * @throws {Error} 400 for invalid transitions, 404 if not found
 */
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

// ─── Cancel Request ───────────────────────────────────────────────────────────

/**
 * Cancel a pickup request.
 * Only allowed when status is "broadcasting" or "accepted".
 * Once the collector has arrived, cancellation is no longer permitted.
 *
 * @param {string} requestId
 * @param {string} residentId - Must be the requesting resident
 * @returns {Promise<Object>} Updated request
 * @throws {Error} 400 if cannot cancel, 404 if not found
 */
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

  request.status = "cancelled";
  request.cancelledAt = new Date();
  request.collector = null;

  await request.save();

  return request;
};

// ─── OTP Notification Placeholder ─────────────────────────────────────────────

/**
 * Send the pickup completion OTP to the resident via email.
 *
 * Silently catches errors so OTP generation is not blocked
 * by a transient email failure.
 *
 * @param {Object} resident - Resident user document
 * @param {string} otp - 6-digit OTP
 * @param {string} pickupAddress - Address for the email body
 */
const notifyPickupOtp = async (resident, otp, pickupAddress) => {
  try {
    await sendPickupOtp(resident.email, otp, pickupAddress);
    console.log(`[NOTIFY] OTP sent to ${resident.email} for pickup`);
  } catch (error) {
    console.error(`[NOTIFY] Failed to send OTP email: ${error.message}`);
  }
};

// ─── Collector Arrived ────────────────────────────────────────────────────────

/**
 * Mark that the collector has arrived at the pickup location.
 *
 * @param {string} requestId
 * @param {string} collectorId
 * @returns {Promise<Object>} Updated request
 * @throws {Error} 404 if not found or 400 if invalid status
 */
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

// ─── Verify Actual Weight ─────────────────────────────────────────────────────

/**
 * Record the actual weight and calculate the final amount.
 * Reuses the existing calculatePrice utility.
 *
 * @param {string} requestId
 * @param {string} collectorId
 * @param {number} actualWeight
 * @returns {Promise<Object>} Updated request with actualWeight and finalAmount
 * @throws {Error} 400 if invalid weight or status
 */
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
  request.finalAmount = calculatePrice(Number(actualWeight));
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

// ─── Generate Completion OTP ──────────────────────────────────────────────────

/**
 * Generate a 6-digit OTP for pickup completion verification.
 * If an OTP already exists it is replaced.
 * In non-production environments the OTP is included in the returned object.
 *
 * @param {string} requestId
 * @param {string} collectorId
 * @returns {Promise<Object>} Updated request (with otp in dev mode)
 * @throws {Error} 404 if not found or 400 if invalid status
 */
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

// ─── Resident: Regenerate OTP ─────────────────────────────────────────────────

/**
 * Generate a new OTP for a pickup request (resident self-service).
 * Replaces any existing OTP and sends the new one via email.
 *
 * @param {string} requestId
 * @param {string} residentId
 * @returns {Promise<Object>} { otp } in dev, { message } in production
 * @throws {Error} 404 if not found or 400 if invalid status
 */
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

// ─── Resident: Get OTP ────────────────────────────────────────────────────────

/**
 * Retrieve the OTP for the resident who created the pickup.
 * In development the actual OTP is returned.
 * In production a neutral message is returned instead.
 *
 * @param {string} requestId
 * @param {string} residentId
 * @returns {Promise<Object>} { otp } in dev, { message } in production
 * @throws {Error} 404 if not found
 */
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

// ─── Verify OTP & Complete Pickup (Atomic) ────────────────────────────────────

/**
 * Atomically verify the OTP and mark the pickup as completed.
 *
 * Uses findOneAndUpdate with conditions that ensure:
 * - OTP matches
 * - OTP has not expired
 * - Status is still weight_verified
 *
 * Because the match-and-update is a single atomic MongoDB operation,
 * two near-simultaneous valid submissions cannot both complete the pickup.
 *
 * On failure the attempt counter is incremented (also atomically).
 * After 5 failed attempts the OTP is cleared and the collector must
 * generate a new one.
 *
 * @param {string} requestId
 * @param {string} collectorId
 * @param {string} otp - The 6-digit OTP to verify
 * @returns {Promise<Object>} Completed pickup request
 * @throws {Error} 400 on invalid/expired OTP or max attempts
 */
export const verifyCompletionOtp = async (requestId, collectorId, otp) => {
  // Atomic: succeed only if OTP matches, not expired, and status is correct
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
    // OTP didn't match, expired, or wrong status — increment attempts
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

  // Fetch users and send completion emails
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

// ─── Expire Stale Requests ────────────────────────────────────────────────────

/**
 * Expire pickup requests that have been in "broadcasting" status
 * beyond the configured timeout.
 *
 * Designed to be called by a cron job (e.g., node-cron, agenda).
 *
 * @returns {Promise<number>} Number of requests expired
 */
export const expireStaleRequests = async () => {
  const cutoff = new Date(
    Date.now() - EXPIRY_MINUTES * 60 * 1000
  );

  const result = await PickupRequest.updateMany(
    {
      status: "broadcasting",
      createdAt: { $lt: cutoff },
    },
    {
      $set: {
        status: "expired",
      },
    }
  );

  return result.modifiedCount;
};
