import { createSlice } from '@reduxjs/toolkit';

const riskSlice = createSlice({
  name: 'risk',
  initialState: {
    zones: [],
    lastUpdated: null,
    loading: false,
  },
  reducers: {
    setZones: (state, action) => {
      state.zones = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateZoneRisk: (state, action) => {
      const zone = state.zones.find((z) => z._id === action.payload._id);
      if (zone) {
        zone.riskLevel = action.payload.riskLevel;
        zone.confidenceScore = action.payload.confidenceScore;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setZones, updateZoneRisk, setLoading } = riskSlice.actions;
export default riskSlice.reducer;