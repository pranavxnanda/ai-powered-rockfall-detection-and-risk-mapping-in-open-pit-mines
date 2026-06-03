const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sensorType: {
    type: String,
    enum: ['lidar', 'seismic'],
    required: true,
  },
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
  installationDate: {
    type: Date,
    default: Date.now,
  },
  calibrationParameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
  },
  lastCommunication: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

sensorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Sensor', sensorSchema);