const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  incidentType: {
    type: String,
    enum: ['rockfall', 'near_miss', 'false_alarm'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    required: true,
  },
  relatedAlertIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
  }],
  description: {
    type: String,
    required: true,
  },
  reportedBy: {
    type: Number,
    required: true,
  },
  investigationNotes: {
    type: String,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  attachments: [String],
}, { timestamps: true });

incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ incidentType: 1 });
incidentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Incident', incidentSchema);