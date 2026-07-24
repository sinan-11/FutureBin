import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";

const ESTIMATED_CREDIT_HOURS = 24;

export const createWallet = async (userId) => {
  const exists = await Wallet.findOne({ user: userId });

  if (exists) {
    const err = new Error("Wallet already exists");
    err.status = 409;
    throw err;
  }

  return await Wallet.create({ user: userId });
};

export const getWalletByUser = async (userId) => {
  return await Wallet.findOne({ user: userId });
};

export const creditWallet = async (userId, amount, session = null) => {
  const wallet = await Wallet.findOne({ user: userId }).session(session);

  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  wallet.balance += amount;

  await wallet.save({ session });

  return wallet;
};

export const debitWallet = async (userId, amount, session = null) => {
  const wallet = await Wallet.findOne({ user: userId }).session(session);

  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  if (wallet.balance < amount) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  wallet.balance -= amount;

  await wallet.save({ session });

  return wallet;
};

export const reserveFunds = async (userId, pickupId, amount, session) => {
  const wallet = await Wallet.findOne({ user: userId }).session(session);

  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  const available = wallet.balance - wallet.heldBalance;

  if (available < amount) {
    const err = new Error("INSUFFICIENT_BALANCE");
    err.available = available;
    err.required = amount;
    throw err;
  }

  const balanceBefore = wallet.balance;
  const heldBefore = wallet.heldBalance;

  wallet.heldBalance += amount;
  await wallet.save({ session });

  const reference = `RESERVE_${pickupId}_${Date.now()}`;

  const transaction = await Transaction.create(
    [
      {
        type: "RESERVE",
        to: userId,
        pickupId,
        amount,
        status: "completed",
        paymentMethod: "wallet",
        description: `Reserved ₹${amount} for pickup`,
        reference,
        balanceBefore,
        balanceAfter: wallet.balance,
        heldBefore,
        heldAfter: wallet.heldBalance,
      },
    ],
    { session }
  );

  return { wallet, transaction: transaction[0] };
};

export const releaseHold = async (userId, pickupId, session) => {
  const wallet = await Wallet.findOne({ user: userId }).session(session);

  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  if (wallet.heldBalance <= 0) return { wallet, transaction: null };

  const heldBefore = wallet.heldBalance;
  const balanceBefore = wallet.balance;

  const releasedAmount = wallet.heldBalance;
  wallet.heldBalance = 0;
  await wallet.save({ session });

  const reference = `RELEASE_${pickupId}_${Date.now()}`;

  const transaction = await Transaction.create(
    [
      {
        type: "RELEASE",
        to: userId,
        pickupId,
        amount: releasedAmount,
        status: "completed",
        paymentMethod: "wallet",
        description: `Released ₹${releasedAmount} hold for pickup`,
        reference,
        balanceBefore,
        balanceAfter: wallet.balance,
        heldBefore,
        heldAfter: 0,
      },
    ],
    { session }
  );

  return { wallet, transaction: transaction[0] };
};

export const releasePartialHold = async (userId, pickupId, amount, session) => {
  const wallet = await Wallet.findOne({ user: userId }).session(session);

  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  if (wallet.heldBalance <= 0) return { wallet, transaction: null };

  const actualRelease = Math.min(amount, wallet.heldBalance);
  const heldBefore = wallet.heldBalance;
  const balanceBefore = wallet.balance;

  wallet.heldBalance -= actualRelease;
  await wallet.save({ session });

  const reference = `RELEASE_PARTIAL_${pickupId}_${Date.now()}`;

  const transaction = await Transaction.create(
    [
      {
        type: "RELEASE",
        to: userId,
        pickupId,
        amount: actualRelease,
        status: "completed",
        paymentMethod: "wallet",
        description: `Released ₹${actualRelease} partial hold for pickup`,
        reference,
        balanceBefore,
        balanceAfter: wallet.balance,
        heldBefore,
        heldAfter: wallet.heldBalance,
      },
    ],
    { session }
  );

  return { wallet, transaction: transaction[0] };
};

export const increaseHold = async (userId, pickupId, additionalAmount, session) => {
  const wallet = await Wallet.findOne({ user: userId }).session(session);

  if (!wallet) throw new Error("WALLET_NOT_FOUND");

  const available = wallet.balance - wallet.heldBalance;

  if (available < additionalAmount) {
    const err = new Error("INSUFFICIENT_BALANCE");
    err.available = available;
    err.required = additionalAmount;
    throw err;
  }

  const heldBefore = wallet.heldBalance;
  const balanceBefore = wallet.balance;

  wallet.heldBalance += additionalAmount;
  await wallet.save({ session });

  const reference = `EXTRA_RESERVE_${pickupId}_${Date.now()}`;

  const transaction = await Transaction.create(
    [
      {
        type: "EXTRA_RESERVE",
        to: userId,
        pickupId,
        amount: additionalAmount,
        status: "completed",
        paymentMethod: "wallet",
        description: `Additional ₹${additionalAmount} reserved for pickup`,
        reference,
        balanceBefore,
        balanceAfter: wallet.balance,
        heldBefore,
        heldAfter: wallet.heldBalance,
      },
    ],
    { session }
  );

  return { wallet, transaction: transaction[0] };
};

export const settlePickup = async (residentId, collectorId, pickupId, finalPrice, session, reservedAmount = finalPrice) => {
  const residentWallet = await Wallet.findOne({ user: residentId }).session(session);

  if (!residentWallet) throw new Error("RESIDENT_WALLET_NOT_FOUND");

  const residentBalanceBefore = residentWallet.balance;
  const residentHeldBefore = residentWallet.heldBalance;

  residentWallet.balance -= finalPrice;
  residentWallet.heldBalance = Math.max(0, residentWallet.heldBalance - reservedAmount);
  await residentWallet.save({ session });

  let collectorWallet = await Wallet.findOne({ user: collectorId }).session(session);

  if (!collectorWallet) {
    collectorWallet = await Wallet.create(
      [{ user: collectorId, balance: 0, heldBalance: 0 }],
      { session }
    );
    collectorWallet = collectorWallet[0];
  }

  const collectorBalanceBefore = collectorWallet.balance;

  collectorWallet.balance += finalPrice;
  await collectorWallet.save({ session });

  const reference = `PICKUP_PAYMENT_${pickupId}_${Date.now()}`;

  const transaction = await Transaction.create(
    [
      {
        type: "PICKUP_PAYMENT",
        from: residentId,
        to: collectorId,
        pickupId,
        amount: finalPrice,
        status: "completed",
        paymentMethod: "wallet",
        description: `Pickup payment of ₹${finalPrice}`,
        reference,
        balanceBefore: residentBalanceBefore,
        balanceAfter: residentWallet.balance,
        heldBefore: residentHeldBefore,
        heldAfter: residentWallet.heldBalance,
      },
    ],
    { session }
  );

  return {
    residentWallet,
    collectorWallet,
    transaction: transaction[0],
  };
};

export const chargeCancellationFee = async (residentId, collectorId, pickupId, feeAmount, session) => {
  const residentWallet = await Wallet.findOne({ user: residentId }).session(session);

  if (!residentWallet) throw new Error("RESIDENT_WALLET_NOT_FOUND");

  const available = residentWallet.balance - residentWallet.heldBalance;

  if (available < feeAmount) {
    const err = new Error("INSUFFICIENT_BALANCE");
    err.available = available;
    err.required = feeAmount;
    throw err;
  }

  const residentBalanceBefore = residentWallet.balance;
  const residentHeldBefore = residentWallet.heldBalance;

  residentWallet.balance -= feeAmount;
  residentWallet.heldBalance = Math.max(0, residentWallet.heldBalance - feeAmount);
  await residentWallet.save({ session });

  let collectorWallet = null;
  let collectorTransaction = null;

  if (collectorId) {
    collectorWallet = await Wallet.findOne({ user: collectorId }).session(session);

    if (!collectorWallet) {
      collectorWallet = await Wallet.create(
        [{ user: collectorId, balance: 0, heldBalance: 0 }],
        { session }
      );
      collectorWallet = collectorWallet[0];
    }

    const collectorBalanceBefore = collectorWallet.balance;
    collectorWallet.balance += feeAmount;
    await collectorWallet.save({ session });

    const collectorRef = `CANCELLATION_FEE_COLLECTOR_${pickupId}_${Date.now()}`;

    collectorTransaction = await Transaction.create(
      [
        {
          type: "CANCELLATION_FEE",
          from: residentId,
          to: collectorId,
          pickupId,
          amount: feeAmount,
          status: "completed",
          paymentMethod: "wallet",
          description: `Cancellation fee of ₹${feeAmount}`,
          reference: collectorRef,
          balanceBefore: collectorBalanceBefore,
          balanceAfter: collectorWallet.balance,
        },
      ],
      { session }
    );

    collectorTransaction = collectorTransaction[0];
  }

  const residentRef = `CANCELLATION_FEE_RESIDENT_${pickupId}_${Date.now()}`;

  const residentTransaction = await Transaction.create(
    [
      {
        type: "CANCELLATION_FEE",
        from: residentId,
        pickupId,
        amount: feeAmount,
        status: "completed",
        paymentMethod: "wallet",
        description: `Cancellation fee of ₹${feeAmount} charged`,
        reference: residentRef,
        balanceBefore: residentBalanceBefore,
        balanceAfter: residentWallet.balance,
        heldBefore: residentHeldBefore,
        heldAfter: residentWallet.heldBalance,
      },
    ],
    { session }
  );

  return {
    residentWallet,
    collectorWallet,
    residentTransaction: residentTransaction[0],
    collectorTransaction,
  };
};

// ─── Withdrawal ────────────────────────────────────────────────────────────

export const withdrawFunds = async (userId, amount, bankDetails) => {
  if (!amount || amount <= 0) {
    const err = new Error("Amount must be greater than zero");
    err.status = 400;
    throw err;
  }

  if (!bankDetails || !bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
    const err = new Error("Bank details are required");
    err.status = 400;
    throw err;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ user: userId }).session(session);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (!wallet.isActive) {
      throw new Error("Wallet is inactive");
    }

    const available = wallet.balance - wallet.heldBalance;

    if (amount > available) {
      const err = new Error(`Insufficient balance. Available: ₹${available}`);
      err.status = 400;
      throw err;
    }

    const balanceBefore = wallet.balance;
    const heldBefore = wallet.heldBalance;

    wallet.balance -= amount;
    await wallet.save({ session });

    const reference = `WD_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const estimatedCreditTime = new Date(Date.now() + ESTIMATED_CREDIT_HOURS * 60 * 60 * 1000);

    const transactions = await Transaction.create(
      [
        {
          type: "WITHDRAWAL",
          from: userId,
          amount,
          status: "processing",
          paymentMethod: "bank_transfer",
          description: `Withdrawal to ${bankDetails.bankName || "bank account"} (${bankDetails.accountNumber.slice(-4)})`,
          reference,
          balanceBefore,
          balanceAfter: wallet.balance,
          heldBefore,
          heldAfter: wallet.heldBalance,
          estimatedCreditTime,
        },
      ],
      { session }
    );

    const transaction = transactions[0];

    const withdrawalRequests = await WithdrawalRequest.create(
      [
        {
          collector: userId,
          wallet: wallet._id,
          amount,
          status: "processing",
          bankDetails: {
            accountHolderName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode,
            bankName: bankDetails.bankName || "",
          },
          transaction: transaction._id,
          estimatedCreditTime,
        },
      ],
      { session }
    );

    const withdrawalRequest = withdrawalRequests[0];

    await session.commitTransaction();
    session.endSession();

    return { wallet, transaction, withdrawalRequest };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getWithdrawals = async (userId) => {
  return await WithdrawalRequest.find({ collector: userId })
    .sort({ createdAt: -1 })
    .populate("transaction");
};

export const getWithdrawalById = async (userId, withdrawalId) => {
  return await WithdrawalRequest.findOne({
    _id: withdrawalId,
    collector: userId,
  }).populate("transaction");
};

export const completeWithdrawal = async (withdrawalId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdrawal = await WithdrawalRequest.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
    }

    if (withdrawal.status !== "processing") {
      throw new Error(`Withdrawal is already ${withdrawal.status}`);
    }

    withdrawal.status = "completed";
    withdrawal.processedAt = new Date();
    await withdrawal.save({ session });

    await Transaction.findByIdAndUpdate(
      withdrawal.transaction,
      { status: "completed" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return withdrawal;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const failWithdrawal = async (withdrawalId, reason) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdrawal = await WithdrawalRequest.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
    }

    if (withdrawal.status !== "processing") {
      throw new Error(`Withdrawal is already ${withdrawal.status}`);
    }

    const wallet = await Wallet.findOne({ user: withdrawal.collector }).session(session);

    if (!wallet) {
      throw new Error("Collector wallet not found");
    }

    const balanceBefore = wallet.balance;

    wallet.balance += withdrawal.amount;
    await wallet.save({ session });

    const refundReference = `REFUND_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await Transaction.create(
      [
        {
          type: "REFUND",
          to: withdrawal.collector,
          amount: withdrawal.amount,
          status: "completed",
          paymentMethod: "wallet",
          description: `Refund for failed withdrawal (${reason || "processing failed"})`,
          reference: refundReference,
          balanceBefore,
          balanceAfter: wallet.balance,
        },
      ],
      { session }
    );

    await Transaction.findByIdAndUpdate(
      withdrawal.transaction,
      { status: "failed", failureReason: reason || "Withdrawal processing failed" },
      { session }
    );

    withdrawal.status = "failed";
    withdrawal.processedAt = new Date();
    withdrawal.failureReason = reason || "Withdrawal processing failed";
    await withdrawal.save({ session });

    await session.commitTransaction();
    session.endSession();

    return withdrawal;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getTransactions = async (userId) => {
  return await Transaction.find({
    $or: [{ from: userId }, { to: userId }],
  })
    .sort({ createdAt: -1 })
    .populate("from", "name email")
    .populate("to", "name email")
    .populate("pickupId");
};
