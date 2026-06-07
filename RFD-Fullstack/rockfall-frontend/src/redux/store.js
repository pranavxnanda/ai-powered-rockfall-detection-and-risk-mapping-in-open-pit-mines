import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import alertReducer from './slices/alertSlice';
import riskReducer from './slices/riskSlice';
import socketReducer from './slices/socketSlice';


const store = configureStore({
  reducer: {
    auth: authReducer,
    alerts: alertReducer,
    risk: riskReducer,
    socket: socketReducer,
  },
});

export default store;