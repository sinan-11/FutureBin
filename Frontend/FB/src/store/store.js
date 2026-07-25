import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import adminReducer from "./slices/adminSlice";
import pickupReducer from "./slices/pickupSlice";
import subscriptionReducer from "./slices/subscriptionSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    admin: adminReducer,
    pickup: pickupReducer,
    subscription: subscriptionReducer,
  },
});

export default store;