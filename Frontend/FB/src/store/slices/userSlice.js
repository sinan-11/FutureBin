import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  profile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.loading = false;
      state.error = null;
    },

    setUserLoading: (state, action) => {
      state.loading = action.payload;
    },

    setUserError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    clearProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setProfile,
  setUserLoading,
  setUserError,
  clearProfile,
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectProfile = (state) => state.user.profile;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;