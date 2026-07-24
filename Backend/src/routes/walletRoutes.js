import express from "express";

import {
  createWalletHandler,
  getMyWallet,
  getTransactionsHandler,
  withdrawHandler,
  getWithdrawalsHandler,
  getWithdrawalByIdHandler,
  completeWithdrawalHandler,
  failWithdrawalHandler,
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

// ─── Withdrawal Routes (Collector only) ────────────────────────────────────

router.post(
  "/withdraw",
  protect,
  authorize("collector"),
  withdrawHandler
);

router.get(
  "/withdrawals",
  protect,
  authorize("collector"),
  getWithdrawalsHandler
);

router.get(
  "/withdrawals/:id",
  protect,
  authorize("collector"),
  getWithdrawalByIdHandler
);

// ─── Admin/Internal Routes ─────────────────────────────────────────────────

router.patch(
  "/withdrawals/:id/complete",
  protect,
  authorize("admin"),
  completeWithdrawalHandler
);

router.patch(
  "/withdrawals/:id/fail",
  protect,
  authorize("admin"),
  failWithdrawalHandler
);

export default router;
