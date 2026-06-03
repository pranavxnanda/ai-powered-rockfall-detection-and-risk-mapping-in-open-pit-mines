const { fetchMLPredictions } = require('../services/mlModel.service');

// Manually trigger ML model data fetch (admin only)
exports.triggerMLFetch = async (req, res, next) => {
  try {
    await fetchMLPredictions();
    res.json({ message: 'ML model data fetch triggered successfully' });
  } catch (error) {
    next(error);
  }
};

// Get ML model status
exports.getMLStatus = async (req, res, next) => {
  try {
    const status = {
      apiUrl: process.env.ML_MODEL_API_URL,
      pollingInterval: process.env.ML_MODEL_POLLING_INTERVAL,
      isPolling: true,
    };
    res.json(status);
  } catch (error) {
    next(error);
  }
};