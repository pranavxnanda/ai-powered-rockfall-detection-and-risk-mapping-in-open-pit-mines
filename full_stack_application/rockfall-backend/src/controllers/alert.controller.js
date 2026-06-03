const Alert = require('../models/mongodb/Alert');
const User = require('../models/sql/User');
const { broadcastAlert } = require('../services/socket.service');

// Get alerts for current user
exports.getMyAlerts = async (req, res, next) => {
  try {

    const userId = String(req.user.id);

    console.log('🔍 Fetching alerts for userId:', userId);
    const totalAlerts = await Alert.countDocuments({});
    console.log('📦 Total alerts in DB:', totalAlerts);

    const alerts = await Alert.find({ 
      targetUserIds: userId 
    })
      .populate('affectedZoneIds', 'zoneName')
      .sort({ generatedAt: -1 })
      .limit(50);

    console.log('✅ Alerts found for user:', alerts.length);

    // Add acknowledged status for current user
    const enrichedAlerts = alerts.map((alert) => {
      const ack = alert.acknowledgments.find((a) => a.userId === userId);
      return {
        ...alert.toObject(),
        acknowledged: !!ack,
        acknowledgedAt: ack?.acknowledgedAt || null,
      };
    });

    res.json({ alerts: enrichedAlerts });
  } catch (error) {
    next(error);
  }
};

// Get all alerts (admin/planner)
exports.getAllAlerts = async (req, res, next) => {
  try {
    const { alertLevel, acknowledged, startDate, endDate } = req.query;

    const filter = {};
    if (alertLevel) filter.alertLevel = alertLevel;
    if (startDate || endDate) {
      filter.generatedAt = {};
      if (startDate) filter.generatedAt.$gte = new Date(startDate);
      if (endDate) filter.generatedAt.$lte = new Date(endDate);
    }

    const alerts = await Alert.find(filter)
      .populate('affectedZoneIds', 'zoneName')
      .sort({ generatedAt: -1 })
      .limit(100);

    res.json({ alerts });
  } catch (error) {
    next(error);
  }
};

// Create alert
exports.createAlert = async (req, res, next) => {
  try {
    const {
      triggeredByAssessmentId,
      alertLevel,
      affectedZoneIds,
      targetUserIds,
      alertMessage,
      expiresAt,
    } = req.body;

    const alert = await Alert.create({
      triggeredByAssessmentId,
      alertLevel,
      affectedZoneIds,
      targetUserIds,
      alertMessage,
      expiresAt,
      deliveryStatus: { websocket: [], email: [], failed: [] },
    });

    // Broadcast alert via WebSocket
    const delivered = broadcastAlert(alert.toObject());
    
    // Update delivery status
    alert.deliveryStatus.websocket = delivered;
    await alert.save();

    res.status(201).json({ message: 'Alert created', alert });
  } catch (error) {
    next(error);
  }
};

// Acknowledge alert
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const userId = String(req.user.id);
    const userRole = req.user.role;

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const isPrivileged = ['administrator', 'planner'].includes(userRole); 

    if (!isPrivileged && !alert.targetUserIds.includes(userId)) { 
      return res.status(403).json({ message: 'Not authorized to acknowledge this alert' });
    }

    // Check if already acknowledged
    const existing = alert.acknowledgments.find((a) => a.userId === userId);
    if (existing) {
      return res.status(400).json({ message: 'Alert already acknowledged' });
    }

    alert.acknowledgments.push({ userId, acknowledgedAt: new Date() });
    await alert.save();

    res.json({ message: 'Alert acknowledged' });
  } catch (error) {
    next(error);
  }
};