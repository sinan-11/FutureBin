import express from "express";
import http from "http";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";
import { initSocket, notifyResidentById, notifyCollectorsByIds } from "./src/config/socket.js";
import { expireStaleRequests } from "./src/services/pickupService.js";

import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import pickupRoutes from "./src/routes/pickupRoutes.js";
import walletRoutes from "./src/routes/walletRoutes.js";

connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO
initSocket(server);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Home Route
app.get("/", (req, res) => {
  res.send("Future Bin API Running");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pickup-requests", pickupRoutes);
app.use("/api/wallet", walletRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─── Stale Request Expiration ────────────────────────────────────────────────
const EXPIRY_INTERVAL = 60 * 1000;

setInterval(async () => {
  try {
    const { count, expiredRequests } = await expireStaleRequests();

    if (count > 0) {
      console.log(`[CRON] Expired ${count} stale pickup request(s)`);

      for (const req of expiredRequests) {
        const eventData = { request: req };

        if (req.resident) {
          notifyResidentById(req.resident, "pickup-expired", eventData);
        }

        if (req.eligibleCollectors && req.eligibleCollectors.length > 0) {
          notifyCollectorsByIds(req.eligibleCollectors, "pickup-expired", eventData);
        }
      }
    }
  } catch (error) {
    console.error("[CRON] Failed to expire stale requests:", error.message);
  }
}, EXPIRY_INTERVAL);

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
