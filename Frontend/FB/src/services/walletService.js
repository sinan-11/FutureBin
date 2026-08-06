import * as walletApi from "../api/walletApi";
import { getErrorMessage } from "../utils/helpers";

export const getWalletService = async () => {
  try {
    const res = await walletApi.getMyWallet();
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const createWalletService = async () => {
  try {
    const res = await walletApi.createWallet();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const getTransactionsService = async () => {
  try {
    const res = await walletApi.getTransactions();
    return res.data.data.transactions;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const withdrawFundsService = async (amount, bankDetails) => {
  try {
    const res = await walletApi.withdrawFunds(amount, bankDetails);
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const getWithdrawalsService = async () => {
  try {
    const res = await walletApi.getWithdrawals();
    return res.data.data.withdrawals;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};

export const getWithdrawalByIdService = async (id) => {
  try {
    const res = await walletApi.getWithdrawalById(id);
    return res.data.data.withdrawal;
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error });
  }
};
