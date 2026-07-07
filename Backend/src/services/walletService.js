import Wallet from "../models/Wallet.js";

export const createWallet = async (userId) => {
  const exists = await Wallet.findOne({ user: userId });
  if (exists) {
    const err = new Error("Wallet already exists for this user");
    err.status = 409;
    throw err;
  }

  const wallet = await Wallet.create({ user: userId });
  return wallet;
};

export const getWalletByUser = async (userId) => {
  return await Wallet.findOne({ user: userId });
};

export const getTransactions = async () => {
  return [];
};
