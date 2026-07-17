import { Server } from "socket.io";
import jwt from "jsonwebtoken";

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
      console.log(`[SOCKET] Collector ${userId} now has ${collectorSockets.get(userId).size} socket(s)`);
    }

    if (userRole === "resident") {
      if (!residentSockets.has(userId)) {
        residentSockets.set(userId, new Set());
      }
      residentSockets.get(userId).add(socket.id);
      console.log(`[SOCKET] Resident ${userId} now has ${residentSockets.get(userId).size} socket(s)`);
    }

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

  if (!collectorIds || collectorIds.length === 0) {
    io.to("collectors").emit(event, data);
    return;
  }

  let emitted = false;

  for (const id of collectorIds) {
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
