import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import adminReducer from "./slices/adminSlice";
import pickupReducer from "./slices/pickupSlice";
import subscriptionReducer from "./slices/subscriptionSlice";
import aiReducer from "./slices/aiSlice";
import reviewReducer from "./slices/reviewSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    admin: adminReducer,
    pickup: pickupReducer,
    subscription: subscriptionReducer,
    ai: aiReducer,
    review: reviewReducer,
  },
});

export default store;