const Zone = require('../models/mongodb/Zone');
const RiskAssessment = require('../models/mongodb/RiskAssessment');

// Get all zones
exports.getAllZones = async (req, res, next) => {
  try {
    const zones = await Zone.find();
    
    // Enrich with latest risk assessment
    const enrichedZones = await Promise.all(
      zones.map(async (zone) => {
        const latestRisk = await RiskAssessment.findOne({ zoneId: zone._id })
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          ...zone.toObject(),
          riskLevel: latestRisk?.riskLevel || 'low',
          confidenceScore: latestRisk?.confidenceScore || 0,
        };
      })
    );

    res.json({ zones: enrichedZones });
  } catch (error) {
    next(error);
  }
};

// Get zone by ID
exports.getZoneById = async (req, res, next) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    const latestRisk = await RiskAssessment.findOne({ zoneId: zone._id })
      .sort({ createdAt: -1 })
      .limit(1);

    res.json({
      zone: {
        ...zone.toObject(),
        riskLevel: latestRisk?.riskLevel || 'low',
        confidenceScore: latestRisk?.confidenceScore || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new zone (admin only)
exports.createZone = async (req, res, next) => {
  try {
    const { zoneName, boundary, zoneType, parentZoneId, metadata } = req.body;

    const zone = await Zone.create({
      zoneName,
      boundary,
      zoneType,
      parentZoneId,
      metadata,
    });

    res.status(201).json({ message: 'Zone created', zone });
  } catch (error) {
    next(error);
  }
};

// Update zone
exports.updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    res.json({ message: 'Zone updated', zone });
  } catch (error) {
    next(error);
  }
};

// Delete zone
exports.deleteZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    res.json({ message: 'Zone deleted' });
  } catch (error) {
    next(error);
  }
};