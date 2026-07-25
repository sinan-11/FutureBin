import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  subscriptions: [],
  loading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setSubscriptions: (state, action) => {
      state.subscriptions = action.payload;
    },
    setSubscriptionLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSubscriptionError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearSubscriptionError: (state) => {
      state.error = null;
    },
    clearSubscriptions: (state) => {
      state.subscriptions = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setSubscriptions,
  setSubscriptionLoading,
  setSubscriptionError,
  clearSubscriptionError,
  clearSubscriptions,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;

export const selectSubscriptions = (state) => state.subscription.subscriptions;
export const selectSubscriptionLoading = (state) => state.subscription.loading;
export const selectSubscriptionError = (state) => state.subscription.error;
