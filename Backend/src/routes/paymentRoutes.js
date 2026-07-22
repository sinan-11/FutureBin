import express from "express";
import {
  createOrder,
  verifyPayment,
} from "../controllers/paymentController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.post("/order", protect, authorize("resident", "collector"), createOrder);
router.post("/verify", protect, authorize("resident", "collector"), verifyPayment);

export default router;
