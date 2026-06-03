const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    required: true,
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
  },
  contributingSensors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sensor',
  }],
  modelVersion: {
    type: String,
    default: 'v1.0',
  },
  detectionDetails: {
    lidarScore: Number,
    seismicScore: Number,
    fusionWeights: Object,
    rawPredictions: Object,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
}, {
  timestamps: true,
  timeseries: {
    timeField: 'createdAt',
    metaField: 'zoneId',
  },
});

riskAssessmentSchema.index({ createdAt: 1, expiresAt: 1 });
riskAssessmentSchema.index({ zoneId: 1, createdAt: -1 });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);