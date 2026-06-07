// import { createSlice } from '@reduxjs/toolkit';

// const alertSlice = createSlice({
//   name: 'alerts',
//   initialState: {
//     alerts: [],
//     unreadCount: 0,
//   },
//   reducers: {
//     setAlerts: (state, action) => {
//       state.alerts = action.payload;
//       state.unreadCount = action.payload.filter((a) => !a.acknowledged).length;
//     },
//     addAlert: (state, action) => {
//       state.alerts.unshift(action.payload);
//       state.unreadCount += 1;
//     },
//     acknowledgeAlert: (state, action) => {
//       const alert = state.alerts.find((a) => a._id === action.payload);
//       if (alert) {
//         alert.acknowledged = true;
//         state.unreadCount = Math.max(0, state.unreadCount - 1);
//       }
//     },
//   },
// });

// export const { setAlerts, addAlert, acknowledgeAlert } = alertSlice.actions;
// export default alertSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchMyAlerts = createAsyncThunk(
  'alerts/fetchMyAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/alerts/my', { headers: { 'Cache-Control': 'no-cache' } });
      return res.data.alerts;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch alerts');
    }
  },
);

export const acknowledgeAlertAsync = createAsyncThunk(
  'alerts/acknowledgeAlert',
  async (alertId, { rejectWithValue }) => {
    try {
     await api.post(`/alerts/${alertId}/acknowledge`);
      return alertId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to acknowledge');
    }
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const alertSlice = createSlice({
  name: 'alerts',
  initialState: {
    alerts: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    // Keep this for WebSocket-pushed alerts
    setAlerts: (state, action) => {
      state.alerts = action.payload;
      state.unreadCount = action.payload.filter((a) => !a.acknowledged).length;
    },

    addAlert: (state, action) => {
      const existingIndex = state.alerts.findIndex((a) => a._id === action.payload._id);
      if (existingIndex >= 0) {
        // Update existing alert
        state.alerts[existingIndex] = action.payload;
      } else {
        // Add new alert
        state.alerts.unshift(action.payload);
        state.unreadCount += 1;
      }
      // Recalculate unread count
      state.unreadCount = state.alerts.filter((a) => !a.acknowledged).length;
    },
    // Keep for optimistic local-only acknowledge if needed
    acknowledgeAlert: (state, action) => {
      const alert = state.alerts.find((a) => a._id === action.payload);
      if (alert) {
        alert.acknowledged = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
  extraReducers: (builder) => {
    // fetchMyAlerts
    builder
      .addCase(fetchMyAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
        state.unreadCount = action.payload.filter((a) => !a.acknowledged).length;
      })
      .addCase(fetchMyAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // acknowledgeAlertAsync
    builder.addCase(acknowledgeAlertAsync.fulfilled, (state, action) => {
      const alert = state.alerts.find((a) => a._id === action.payload);
      if (alert) {
        alert.acknowledged = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });
  },
});

export const { setAlerts, addAlert, acknowledgeAlert } = alertSlice.actions;
export default alertSlice.reducer;