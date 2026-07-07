import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  myRequests: { current: [], completed: [], cancelled: [] },
  assignedRequests: { active: [], completed: [] },
  loading: false,
  error: null,
};

const pickupSlice = createSlice({
  name: "pickup",
  initialState,
  reducers: {
    setMyRequests: (state, action) => {
      state.myRequests = action.payload;
    },

    setAssignedRequests: (state, action) => {
      state.assignedRequests = action.payload;
    },

    setPickupLoading: (state, action) => {
      state.loading = action.payload;
    },

    setPickupError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    clearPickupError: (state) => {
      state.error = null;
    },

    clearPickups: (state) => {
      state.myRequests = { current: [], completed: [], cancelled: [] };
      state.assignedRequests = { active: [], completed: [] };
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setMyRequests,
  setAssignedRequests,
  setPickupLoading,
  setPickupError,
  clearPickupError,
  clearPickups,
} = pickupSlice.actions;

export default pickupSlice.reducer;

export const selectMyRequests = (state) => state.pickup.myRequests;
export const selectAssignedRequests = (state) => state.pickup.assignedRequests;
export const selectPickupLoading = (state) => state.pickup.loading;
export const selectPickupError = (state) => state.pickup.error;
