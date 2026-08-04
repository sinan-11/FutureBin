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
  confirmCashReceived,
  confirmExtraPayment,
  payExtraFromWallet,
} from "../services/pickupService.js";

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
      paymentMethod,
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

    if (paymentMethod && !["wallet", "cash"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be 'wallet' or 'cash'",
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
        paymentMethod,
      },
      req.user.id
    );

    notifyCollectorsByIds(result.nearbyCollectors, "new-request", {
      request: result.request,
      nearbyCollectors: result.nearbyCollectors,
    });

    res.status(201).json({
      success: true,
      message: "Pickup request created successfully",
      data: result.request,
      nearbyCollectors: result.nearbyCollectors,
    });
  } catch (error) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance. Please top up your wallet.",
        code: "INSUFFICIENT_BALANCE",
        available: error.available,
        required: error.required,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const request = await acceptPickupRequest(
      req.params.id,
      req.user.id
    );

    notifyPickupParticipants(request.resident, req.user.id, "pickup-accepted", {
      request,
    });

    notifyCollectorById(req.user.id, "pickup-assigned", {
      request,
    });

    res.status(200).json({
      success: true,
      message: "Pickup request accepted successfully",
      data: request,
    });
  } catch (error) {
    if (
      error.message.includes("already been accepted") ||
      error.message.includes("already have an active pickup")
    ) {
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

export const arriveRequest = async (req, res) => {
  try {
    const request = await arriveAtPickup(req.params.id, req.user.id);

    notifyPickupParticipants(request.resident, req.user.id, "collector-arrived", {
      request,
    });
    notifyCollectorById(req.user.id, "arrival-confirmed", {
      request,
    });

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

    if (result.requiresExtraPayment) {
      notifyResidentById(result.resident, "extra-payment-required", {
        request: result,
      });

      return res.status(200).json({
        success: true,
        message: "Final price exceeds reserved amount. Extra payment required.",
        data: result,
      });
    }

    notifyResidentById(result.resident, "weight-verified", {
      request: result,
    });

    if (result.paymentMethod !== "cash") {
      notifyResidentById(result.resident, "otp-generated", {
        request: result,
      });
    }

    notifyCollectorById(req.user.id, "weight-saved", {
      request: result,
    });

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

export const generateOtpHandler = async (req, res) => {
  try {
    const result = await generateCompletionOtp(req.params.id, req.user.id);

    notifyResidentById(result.resident, "otp-regenerated", {
      request: result,
    });

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

export const regenerateOtpHandler = async (req, res) => {
  try {
    const result = await regenerateCompletionOtp(req.params.id, req.user.id);

    notifyResidentById(req.user.id, "otp-regenerated", {
      request: result,
    });

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

    notifyResidentById(request.resident, "leave-review", {
      pickupId: request._id,
      revieweeId: req.user.id,
      message: "Your pickup is complete! Please rate your collector.",
    });

    notifyCollectorById(req.user.id, "leave-review", {
      pickupId: request._id,
      revieweeId: request.resident,
      message: "Pickup completed! Please rate the resident.",
    });

    notifyPickupParticipants(request.resident, req.user.id, "chat-closed", {
      pickupId: request._id,
    });

    res.status(200).json({
      success: true,
      message: "Pickup completed successfully",
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelRequestHandler = async (req, res) => {
  try {
    const { request, collectorId } = await cancelRequest(
      req.params.id,
      req.user.id
    );

    if (collectorId) {
      notifyCollectorById(collectorId, "pickup-cancelled", {
        request,
      });
    } else if (request.eligibleCollectors && request.eligibleCollectors.length > 0) {
      notifyCollectorsByIds(request.eligibleCollectors, "pickup-cancelled", {
        request,
      });
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
    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance to pay cancellation fee.",
        code: "INSUFFICIENT_BALANCE",
        available: error.available,
        required: error.required,
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const confirmCashReceivedHandler = async (req, res) => {
  try {
    const request = await confirmCashReceived(req.params.id, req.user.id);

    notifyResidentById(request.resident, "cash-confirmed", {
      request,
    });

    notifyResidentById(request.resident, "otp-generated", {
      request,
    });

    res.status(200).json({
      success: true,
      message: "Cash received confirmed. OTP can now be generated.",
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const confirmExtraPaymentHandler = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    const request = await confirmExtraPayment(
      req.params.id,
      req.user.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    notifyCollectorById(request.collector, "extra-payment-completed", {
      request,
    });

    res.status(200).json({
      success: true,
      message: "Extra payment verified. OTP has been sent.",
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const payExtraFromWalletHandler = async (req, res) => {
  try {
    const request = await payExtraFromWallet(req.params.id, req.user.id);

    notifyCollectorById(request.collector, "extra-payment-completed", {
      request,
    });

    res.status(200).json({
      success: true,
      message: "Extra payment deducted from wallet. OTP has been sent.",
      data: request,
    });
  } catch (error) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance for extra payment",
        available: error.available,
        required: error.required,
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
