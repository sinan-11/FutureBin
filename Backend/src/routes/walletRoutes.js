import express from "express";

import {
  createWalletHandler,
  getMyWallet,
  getTransactionsHandler,
} from "../controllers/walletController.js";

import {
  protect,
  authorize,
} from "../middlewares/auth.js";

const router = express.Router();

console.log("[WalletRoutes] Registering wallet routes...");

router.post(
  "/create",
  protect,
  authorize("resident", "collector"),
  createWalletHandler
);

router.get(
  "/me",
  protect,
  authorize("resident", "collector"),
  getMyWallet
);

router.get(
  "/transactions",
  protect,
  authorize("resident", "collector"),
  getTransactionsHandler
);

export default router;
