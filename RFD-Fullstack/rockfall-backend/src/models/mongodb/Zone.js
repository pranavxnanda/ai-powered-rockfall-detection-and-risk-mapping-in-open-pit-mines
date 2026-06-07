const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  zoneName: {
    type: String,
    required: true,
    index: true,
  },
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon',
    },
    coordinates: {
      type: [[[Number]]], 
      required: true,
    },
  },
  zoneType: {
    type: String,
    enum: ['working_area', 'transport_route', 'restricted'],
    required: true,
  },
  parentZoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    default: null,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

zoneSchema.index({ boundary: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);