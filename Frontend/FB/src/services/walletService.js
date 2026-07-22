import * as walletApi from "../api/walletApi";
import { getErrorMessage } from "../utils/helpers";

export const getWalletService = async () => {
  try {
    const res = await walletApi.getMyWallet();
    return res.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createWalletService = async () => {
  try {
    const res = await walletApi.createWallet();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getTransactionsService = async () => {
  try {
    const res = await walletApi.getTransactions();
    return res.data.data.transactions;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
