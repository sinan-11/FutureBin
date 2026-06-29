import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  pendingCollectors: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,

  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;

      state.pendingCollectors = action.payload.filter(
        (user) =>
          user.role === "collector" &&
          !user.isApproved
      );

      state.loading = false;
      state.error = null;
    },

    setAdminLoading: (state, action) => {
      state.loading = action.payload;
    },

    setAdminError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    updateUser: (state, action) => {
      const updatedUser = action.payload;

      state.users = state.users.map((user) =>
        user._id === updatedUser._id
          ? updatedUser
          : user
      );

      state.pendingCollectors =
        state.users.filter(
          (user) =>
            user.role === "collector" &&
            !user.isApproved
        );
    },

    removeUser: (state, action) => {
      const userId = action.payload;

      state.users = state.users.filter(
        (user) => user._id !== userId
      );

      state.pendingCollectors =
        state.users.filter(
          (user) =>
            user.role === "collector" &&
            !user.isApproved
        );
    },

    clearAdmin: (state) => {
      state.users = [];
      state.pendingCollectors = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setUsers,
  setAdminLoading,
  setAdminError,
  updateUser,
  removeUser,
  clearAdmin,
} = adminSlice.actions;

export default adminSlice.reducer;

// Selectors
export const selectUsers = (state) => state.admin.users;

export const selectPendingCollectors = (state) =>
  state.admin.pendingCollectors;

export const selectAdminLoading = (state) =>
  state.admin.loading;

export const selectAdminError = (state) =>
  state.admin.error;