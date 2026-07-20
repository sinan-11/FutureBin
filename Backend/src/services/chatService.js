import ChatMessage from "../models/ChatMessage.js";
import PickupRequest from "../models/PickupRequest.js";

const CHAT_ACTIVE_STATUSES = [
  "accepted",
  "collector_arrived",
  "collecting",
  "weight_verified",
  "payment_pending",
  "paid",
];

const validateParticipant = async (pickupId, userId) => {
  const pickup = await PickupRequest.findById(pickupId).select(
    "resident collector status"
  );

  if (!pickup) {
    throw Object.assign(new Error("Pickup request not found"), { status: 404 });
  }

  const isResident =
    pickup.resident && String(pickup.resident) === String(userId);
  const isCollector =
    pickup.collector && String(pickup.collector) === String(userId);

  if (!isResident && !isCollector) {
    throw Object.assign(new Error("You are not a participant of this pickup"), {
      status: 403,
    });
  }

  return pickup;
};

export const sendMessage = async (pickupId, senderId, receiverId, message) => {
  const pickup = await validateParticipant(pickupId, senderId);

  if (!CHAT_ACTIVE_STATUSES.includes(pickup.status)) {
    throw Object.assign(
      new Error("Chat is no longer available for this pickup"),
      { status: 400 }
    );
  }

  const chatMessage = await ChatMessage.create({
    pickupId,
    senderId,
    receiverId,
    message,
  });

  return chatMessage;
};

export const getMessages = async (pickupId, userId) => {
  await validateParticipant(pickupId, userId);

  const messages = await ChatMessage.find({ pickupId })
    .sort({ createdAt: 1 })
    .lean();

  return messages;
};

export const markAsRead = async (pickupId, userId) => {
  await validateParticipant(pickupId, userId);

  const result = await ChatMessage.updateMany(
    {
      pickupId,
      receiverId: userId,
      read: false,
    },
    {
      $set: { read: true },
    }
  );

  return result.modifiedCount;
};
