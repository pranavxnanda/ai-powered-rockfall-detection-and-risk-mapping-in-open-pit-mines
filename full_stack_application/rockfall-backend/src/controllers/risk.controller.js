const RiskAssessment = require('../models/mongodb/RiskAssessment');
const Zone = require('../models/mongodb/Zone');
const { broadcastRiskUpdate } = require('../services/socket.service');

// Get all risk assessments
exports.getAllRisks = async (req, res, next) => {
  try {
    const { zoneId, startDate, endDate, riskLevel } = req.query;

    const filter = {};
    if (zoneId) filter.zoneId = zoneId;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const risks = await RiskAssessment.find(filter)
      .populate('zoneId', 'zoneName zoneType')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ risks });
  } catch (error) {
    next(error);
  }
};

// Get latest risk for each zone
exports.getLatestRisks = async (req, res, next) => {
  try {
    const zones = await Zone.find();
    
    const latestRisks = await Promise.all(
      zones.map(async (zone) => {
        const risk = await RiskAssessment.findOne({ zoneId: zone._id })
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          zoneId: zone._id,
          zoneName: zone.zoneName,
          riskLevel: risk?.riskLevel || 'low',
          confidenceScore: risk?.confidenceScore || 0,
          lastUpdated: risk?.createdAt || null,
        };
      })
    );

    res.json({ risks: latestRisks });
  } catch (error) {
    next(error);
  }
};

// Create risk assessment (for ML model or admin)
exports.createRiskAssessment = async (req, res, next) => {
  try {
    const {
      zoneId,
      riskLevel,
      confidenceScore,
      contributingSensors,
      modelVersion,
      detectionDetails,
    } = req.body;

    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    const risk = await RiskAssessment.create({
      zoneId,
      riskLevel,
      confidenceScore,
      contributingSensors,
      modelVersion,
      detectionDetails,
    });

    // Broadcast real-time update via WebSocket
    broadcastRiskUpdate({
      _id: zone._id,
      zoneName: zone.zoneName,
      riskLevel,
      confidenceScore,
    });

    res.status(201).json({ message: 'Risk assessment created', risk });
  } catch (error) {
    next(error);
  }
};