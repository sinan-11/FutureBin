import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getActivePickupForCollector } from "../services/pickupService.js";
import { sendMessage, markAsRead } from "../services/chatService.js";

let io = null;

const collectorSockets = new Map();
const residentSockets = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, userRole } = socket;
    console.log(`[SOCKET] Connected: ${socket.id} (user: ${userId}, role: ${userRole})`);

    if (userRole === "collector") {
      if (!collectorSockets.has(userId)) {
        collectorSockets.set(userId, new Set());
      }
      collectorSockets.get(userId).add(socket.id);
      socket.join("collectors");
      console.log(`[SOCKET] Collector ${userId} now has ${collectorSockets.get(userId).size} socket(s)`);
    }

    if (userRole === "resident") {
      if (!residentSockets.has(userId)) {
        residentSockets.set(userId, new Set());
      }
      residentSockets.get(userId).add(socket.id);
      console.log(`[SOCKET] Resident ${userId} now has ${residentSockets.get(userId).size} socket(s)`);
    }

    if (userRole === "collector") {
      socket.on("collector-location-update", async (data) => {
        try {
          const { pickupId, latitude, longitude } = data;

          if (!pickupId || latitude == null || longitude == null) return;

          const pickup = await getActivePickupForCollector(userId);

          if (!pickup || String(pickup._id) !== String(pickupId)) return;

          const residentId = pickup.resident?._id;
          if (!residentId) return;

          notifyResidentById(String(residentId), "collector-location", {
            pickupId: pickup._id,
            location: { latitude, longitude },
          });
        } catch (error) {
          console.error(`[SOCKET] collector-location-update error: ${error.message}`);
        }
      });
    }

    socket.on("chat-message", async (data) => {
      try {
        const { pickupId, message } = data;

        if (!pickupId || !message || !message.trim()) return;

        const PickupRequest = (await import("../models/PickupRequest.js")).default;
        const pickupDoc = await PickupRequest.findById(pickupId).select("resident collector status");

        if (!pickupDoc) {
          socket.emit("chat-error", { message: "Pickup not found" });
          return;
        }

        const isResident = String(pickupDoc.resident) === String(userId);
        const isCollector = pickupDoc.collector && String(pickupDoc.collector) === String(userId);

        if (!isResident && !isCollector) {
          socket.emit("chat-error", { message: "You are not a participant" });
          return;
        }

        const receiverId = isResident ? pickupDoc.collector : pickupDoc.resident;

        const chatMessage = await sendMessage(
          pickupId,
          userId,
          receiverId,
          message.trim()
        );

        if (pickupDoc.resident && pickupDoc.collector) {
          notifyPickupParticipants(
            String(pickupDoc.resident),
            String(pickupDoc.collector),
            "chat-message",
            { message: chatMessage }
          );
        }
      } catch (error) {
        console.error(`[SOCKET] chat-message error: ${error.message}`);
        socket.emit("chat-error", { message: error.message });
      }
    });

    socket.on("chat-read", async (data) => {
      try {
        const { pickupId } = data;

        if (!pickupId) return;

        const count = await markAsRead(pickupId, userId);

        socket.emit("chat-read-ack", { pickupId, modifiedCount: count });

        if (count > 0) {
          const PickupRequest = (await import("../models/PickupRequest.js")).default;
          const pickup = await PickupRequest.findById(pickupId).select("resident collector");
          if (pickup) {
            const senderId = String(pickup.resident) === userId
              ? String(pickup.collector)
              : String(pickup.resident);
            const senderRole = String(pickup.resident) === userId ? "collector" : "resident";

            if (senderRole === "collector") {
              notifyCollectorById(senderId, "messages-read", { pickupId });
            } else {
              notifyResidentById(senderId, "messages-read", { pickupId });
            }
          }
        }
      } catch (error) {
        console.error(`[SOCKET] chat-read error: ${error.message}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Disconnected: ${socket.id}`);

      if (userRole === "collector") {
        const sockets = collectorSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            collectorSockets.delete(userId);
          }
        }
      }

      if (userRole === "resident") {
        const sockets = residentSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            residentSockets.delete(userId);
          }
        }
      }
    });
  });

  return io;
};

export const getIO = () => io;


export const notifyCollectorById = (collectorId, event, data) => {
  if (!io) {
    console.log(`[SOCKET] notifyCollectorById: io is null, cannot emit "${event}"`);
    return;
  }
  const key = String(collectorId);
  const sockets = collectorSockets.get(key);
  console.log(`[SOCKET] notifyCollectorById: key="${key}", found ${sockets ? sockets.size : 0} socket(s), map has ${collectorSockets.size} collector(s)`);
  if (sockets) {
    for (const sid of sockets) {
      io.to(sid).emit(event, data);
      console.log(`[SOCKET] Emitted "${event}" to socket ${sid}`);
    }
  }
};


export const notifyCollectorsByIds = (collectorIds, event, data) => {
  if (!io) return;

  let emitted = false;

  for (const id of collectorIds || []) {
    const sockets = collectorSockets.get(String(id));
    if (sockets) {
      for (const sid of sockets) {
        io.to(sid).emit(event, data);
        emitted = true;
      }
    }
  }

  if (!emitted) {
    io.to("collectors").emit(event, data);
  }
};


export const notifyResidentById = (residentId, event, data) => {
  if (!io) return;
  const sockets = residentSockets.get(String(residentId));
  if (sockets) {
    for (const sid of sockets) {
      io.to(sid).emit(event, data);
    }
  }
};


export const notifyPickupParticipants = (residentId, collectorId, event, data) => {
  notifyResidentById(residentId, event, data);
  if (collectorId) {
    notifyCollectorById(collectorId, event, data);
  }
};
