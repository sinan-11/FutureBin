import {
  notifyCollectorsByIds,
  notifyCollectorById,
  notifyResidentById,
  notifyPickupParticipants,
} from "../config/socket.js";
import {
  createPickupRequest,
  acceptPickupRequest,
  rejectPickupRequest,
  arriveAtPickup,
  verifyActualWeight,
  generateCompletionOtp,
  getPickupOtp,
  regenerateCompletionOtp,
  verifyCompletionOtp,
  getResidentRequests,
  getCollectorRequests,
  getAvailableRequests,
  updateRequestStatus,
  cancelRequest,
} from "../services/pickupService.js";

// ─── Create Pickup Request ────────────────────────────────────────────────────

export const createRequest = async (req, res) => {
  try {
    const {
      wasteType,
      estimatedWeight,
      pickupAddress,
      coordinates,
      description,
      images,
      scheduledAt,
    } = req.body;

    if (!wasteType) {
      return res.status(400).json({
        success: false,
        message: "Waste type is required",
      });
    }

    if (
      estimatedWeight === undefined ||
      Number(estimatedWeight) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Estimated weight must be greater than 0",
      });
    }

    if (!pickupAddress) {
      return res.status(400).json({
        success: false,
        message: "Pickup address is required",
      });
    }

    if (
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coordinates must be an array of [longitude, latitude]",
      });
    }

    const lng = Number(coordinates[0]);
    const lat = Number(coordinates[1]);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        success: false,
        message: "Coordinates must be valid numbers",
      });
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Coordinates are out of valid range",
      });
    }

    if (scheduledAt && new Date(scheduledAt) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future",
      });
    }

    const result = await createPickupRequest(
      {
        wasteType,
        estimatedWeight: Number(estimatedWeight),
        pickupAddress,
        coordinates,
        description,
        images,
        scheduledAt,
      },
      req.user.id
    );

    notifyCollectorsByIds(result.nearbyCollectors, "new-request", {
      request: result.request,
      nearbyCollectors: result.nearbyCollectors,
    });
    console.log(`[SOCKET] new-request broadcast to ${result.nearbyCollectors.length} nearby collector(s)`);

    res.status(201).json({
      success: true,
      message: "Pickup request created successfully",
      data: result.request,
      nearbyCollectors: result.nearbyCollectors,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Accept Pickup Request ────────────────────────────────────────────────────

export const acceptRequest = async (req, res) => {
  try {
    const request = await acceptPickupRequest(
      req.params.id,
      req.user.id
    );

    notifyPickupParticipants(request.resident, req.user.id, "pickup-accepted", {
      request,
    });
    console.log(`[SOCKET] pickup-accepted sent to resident ${request.resident}`);

    notifyCollectorById(req.user.id, "pickup-assigned", {
      request,
    });
    console.log(`[SOCKET] pickup-assigned sent to collector ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: "Pickup request accepted successfully",
      data: request,
    });
  } catch (error) {
    if (error.message.includes("already been accepted")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Reject Pickup Request (Collector) ─────────────────────────────────────────

export const rejectRequest = async (req, res) => {
  try {
    const request = await rejectPickupRequest(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Pickup request rejected",
      data: request,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Resident: Get My Requests ────────────────────────────────────────────────

export const getMyRequests = async (req, res) => {
  try {
    const requests = await getResidentRequests(req.user.id);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Collector: Get Available Requests ────────────────────────────────────────

export const getAvailable = async (req, res) => {
  try {
    const requests = await getAvailableRequests(req.user.id);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Collector: Get Assigned Requests ─────────────────────────────────────────

export const getAssignedRequests = async (req, res) => {
  try {
    const requests = await getCollectorRequests(req.user.id);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Update Request Status ────────────────────────────────────────────────────

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const request = await updateRequestStatus(
      req.params.id,
      req.user.id,
      status
    );

    res.status(200).json({
      success: true,
      message: `Request status updated to "${status}"`,
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Collector Arrived ─────────────────────────────────────────────────────────

export const arriveRequest = async (req, res) => {
  try {
    const request = await arriveAtPickup(req.params.id, req.user.id);

    notifyPickupParticipants(request.resident, req.user.id, "collector-arrived", {
      request,
    });
    notifyCollectorById(req.user.id, "arrival-confirmed", {
      request,
    });
    console.log(`[SOCKET] collector-arrived sent to resident ${request.resident}`);

    res.status(200).json({
      success: true,
      message: "Arrival confirmed",
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Verify Actual Weight ──────────────────────────────────────────────────────

export const verifyWeightHandler = async (req, res) => {
  try {
    const { actualWeight } = req.body;

    if (!actualWeight || Number(actualWeight) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Actual weight must be greater than 0",
      });
    }

    const result = await verifyActualWeight(
      req.params.id,
      req.user.id,
      Number(actualWeight)
    );

    notifyResidentById(result.resident, "weight-verified", {
      request: result,
    });
    notifyResidentById(result.resident, "otp-generated", {
      request: result,
    });
    notifyCollectorById(req.user.id, "weight-saved", {
      request: result,
    });
    console.log(`[SOCKET] weight-verified + otp-generated sent to resident ${result.resident}`);

    res.status(200).json({
      success: true,
      message: "Weight verified. OTP sent to resident.",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Generate Completion OTP ───────────────────────────────────────────────────

export const generateOtpHandler = async (req, res) => {
  try {
    const result = await generateCompletionOtp(req.params.id, req.user.id);

    notifyResidentById(result.resident, "otp-regenerated", {
      request: result,
    });
    console.log(`[SOCKET] otp-regenerated sent to resident ${result.resident}`);

    res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Resident: Get OTP ─────────────────────────────────────────────────────────

export const getOtpHandler = async (req, res) => {
  try {
    const result = await getPickupOtp(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Resident: Regenerate OTP ──────────────────────────────────────────────────

export const regenerateOtpHandler = async (req, res) => {
  try {
    const result = await regenerateCompletionOtp(req.params.id, req.user.id);

    notifyResidentById(req.user.id, "otp-regenerated", {
      request: result,
    });
    console.log(`[SOCKET] otp-regenerated sent to resident ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: "New OTP sent to your email",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Verify OTP & Complete Pickup ──────────────────────────────────────────────

export const verifyOtpHandler = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "A valid 6-digit OTP is required",
      });
    }

    const request = await verifyCompletionOtp(
      req.params.id,
      req.user.id,
      otp
    );

    notifyPickupParticipants(request.resident, req.user.id, "pickup-completed", {
      request,
    });
    console.log(`[SOCKET] pickup-completed sent to resident ${request.resident} and collector ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: "Pickup completed successfully",
      data: request,
    });
  } catch (error) {
    const status = error.message.includes("Maximum") ? 400 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── Cancel Request (Resident) ────────────────────────────────────────────────

export const cancelRequestHandler = async (req, res) => {
  try {
    const request = await cancelRequest(
      req.params.id,
      req.user.id
    );

    if (request.collector) {
      notifyCollectorById(request.collector, "pickup-cancelled", {
        request,
      });
      console.log(`[SOCKET] pickup-cancelled sent to collector ${request.collector}`);
    }

    notifyResidentById(req.user.id, "pickup-cancelled", {
      request,
    });

    res.status(200).json({
      success: true,
      message: "Pickup request cancelled successfully",
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
