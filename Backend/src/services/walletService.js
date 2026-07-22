import mongoose from "mongoose";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

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

export const settlePickup = async (residentId, collectorId, pickupId, finalPrice, session) => {
  const residentWallet = await Wallet.findOne({ user: residentId }).session(session);

  if (!residentWallet) throw new Error("RESIDENT_WALLET_NOT_FOUND");

  const residentBalanceBefore = residentWallet.balance;
  const residentHeldBefore = residentWallet.heldBalance;

  residentWallet.balance -= finalPrice;
  residentWallet.heldBalance = Math.max(0, residentWallet.heldBalance - finalPrice);
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

export const getTransactions = async (userId) => {
  return await Transaction.find({
    $or: [{ from: userId }, { to: userId }],
  })
    .sort({ createdAt: -1 })
    .populate("from", "name email")
    .populate("to", "name email")
    .populate("pickupId");
};
