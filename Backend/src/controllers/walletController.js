import * as walletService from "../services/walletService.js";

export const createWalletHandler = async (req, res) => {
  try {
    const wallet = await walletService.createWallet(req.user.id);

    res.status(201).json({ success: true, message: "Wallet created", data: wallet });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getMyWallet = async (req, res) => {
  try {
    const wallet = await walletService.getWalletByUser(req.user.id);

    if (!wallet) {
      return res.status(200).json({ success: true, message: "No wallet found", data: { hasWallet: false } });
    }

    res.status(200).json({ success: true, data: { hasWallet: true, wallet } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionsHandler = async (req, res) => {
  try {
    const transactions = await walletService.getTransactions(req.user.id);

    res.status(200).json({ success: true, data: { transactions } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
