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

// ─── Withdrawal Handlers ───────────────────────────────────────────────────

export const withdrawHandler = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!bankDetails || !bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      return res.status(400).json({ success: false, message: "Bank details are required" });
    }

    const result = await walletService.withdrawFunds(req.user.id, amount, bankDetails);

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully. ₹" + amount + " has been deducted from your wallet. Expected credit within 24 hours.",
      data: result,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getWithdrawalsHandler = async (req, res) => {
  try {
    const withdrawals = await walletService.getWithdrawals(req.user.id);

    res.status(200).json({ success: true, data: { withdrawals } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWithdrawalByIdHandler = async (req, res) => {
  try {
    const withdrawal = await walletService.getWithdrawalById(req.user.id, req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Withdrawal not found" });
    }

    res.status(200).json({ success: true, data: { withdrawal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeWithdrawalHandler = async (req, res) => {
  try {
    const withdrawal = await walletService.completeWithdrawal(req.params.id);

    res.status(200).json({
      success: true,
      message: "Withdrawal marked as completed",
      data: { withdrawal },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const failWithdrawalHandler = async (req, res) => {
  try {
    const { reason } = req.body;

    const withdrawal = await walletService.failWithdrawal(req.params.id, reason);

    res.status(200).json({
      success: true,
      message: "Withdrawal failed. Amount has been refunded to wallet.",
      data: { withdrawal },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
