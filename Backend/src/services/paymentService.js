import crypto from "crypto";
import getRazorpayInstance from "../config/razorpay.js";

export const createOrder = async (amount, receipt) => {
  return await getRazorpayInstance().orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt,
  });
};

export const verifyPaymentSignature = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
};

export const fetchPayment = async (paymentId) => {
  return await getRazorpayInstance().payments.fetch(paymentId);
};

export const fetchOrder = async (orderId) => {
  return await getRazorpayInstance().orders.fetch(orderId);
};

export const refundPayment = async (paymentId, amount, notes = {}) => {
  return await getRazorpayInstance().payments.refund(paymentId, {
    amount: Math.round(amount * 100),
    notes,
  });
};
