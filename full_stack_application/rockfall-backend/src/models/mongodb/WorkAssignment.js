const mongoose = require('mongoose');

const workAssignmentSchema = new mongoose.Schema({
  assignedUserIds: [{
    type: Number, 
  }],
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true,
  },
  scheduledStart: {
    type: Date,
    required: true,
  },
  scheduledEnd: {
    type: Date,
    required: true,
  },
  workType: {
    type: String,
    required: true,
  },
  requiredEquipment: [String],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  associatedAlerts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
  }],
}, { timestamps: true });

workAssignmentSchema.index({ zoneId: 1, scheduledStart: 1 });
workAssignmentSchema.index({ assignedUserIds: 1 });

module.exports = mongoose.model('WorkAssignment', workAssignmentSchema);