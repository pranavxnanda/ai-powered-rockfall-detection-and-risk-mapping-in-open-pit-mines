const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  triggeredByAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RiskAssessment',
  },
  alertLevel: {
    type: String,
    enum: ['warning', 'danger', 'critical'],
    required: true,
  },
  affectedZoneIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
  }],
  targetUserIds: [{
    type: Number, 
  }],
  alertMessage: {
    type: String,
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
  },
  acknowledgments: [{
    userId: Number,
    acknowledgedAt: Date,
  }],
  deliveryStatus: {
    websocket: [Number],
    email: [Number],
    failed: [Number],
  },
}, { timestamps: true });

alertSchema.index({ targetUserIds: 1, generatedAt: -1 });
alertSchema.index({ affectedZoneIds: 1 });

module.exports = mongoose.model('Alert', alertSchema);