import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import * as paymentService from "../services/paymentService.js";
import * as walletService from "../services/walletService.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const receipt = `TB${Date.now().toString(36)}`;

    const order = await paymentService.createOrder(amount, receipt);

    await Transaction.create({
      type: "TOPUP",
      to: userId,
      amount,
      status: "pending",
      paymentMethod: "razorpay",
      razorpayOrderId: order.id,
      description: "Wallet top-up via Razorpay",
      reference: receipt,
    });

    return res.status(201).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[createOrder error]", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = req.user.id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    const isValid = paymentService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    const transaction = await Transaction.findOne({
      razorpayOrderId: razorpay_order_id,
      to: userId,
    }).session(session);

    if (!transaction) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status === "completed") {
      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        transaction,
      });
    }

    if (!isValid) {
      transaction.status = "failed";
      transaction.failureReason = "Signature mismatch";

      await transaction.save({ session });

      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const payment = await paymentService.fetchPayment(
      razorpay_payment_id
    );

    if (payment.amount !== transaction.amount * 100) {
      transaction.status = "failed";
      transaction.failureReason = "Amount mismatch";

      await transaction.save({ session });

      await session.commitTransaction();

      return res.status(400).json({
        success: false,
        message: "Amount mismatch",
      });
    }

    const wallet = await walletService.creditWallet(
      userId,
      transaction.amount,
      session
    );

    transaction.status = "completed";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.balanceAfter = wallet.balance;
    transaction.heldAfter = wallet.heldBalance;

    await transaction.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Wallet credited successfully",
      wallet: {
        balance: wallet.balance,
        heldBalance: wallet.heldBalance,
        currency: wallet.currency,
      },
      transaction,
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};
