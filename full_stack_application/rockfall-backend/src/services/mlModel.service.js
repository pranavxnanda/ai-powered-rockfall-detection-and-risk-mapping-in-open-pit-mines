const axios = require('axios');
const Zone = require('../models/mongodb/Zone');
const RiskAssessment = require('../models/mongodb/RiskAssessment');
const Alert = require('../models/mongodb/Alert');
const User = require('../models/sql/User');
const { broadcastRiskUpdate, broadcastAlert } = require('./socket.service');

const ML_API_URL = process.env.ML_MODEL_API_URL;
const POLLING_INTERVAL = parseInt(process.env.ML_MODEL_POLLING_INTERVAL) || 2000;


const activeAlertCache = new Map();

// Helpers 

const mapConfidenceToRiskLevel = (confidence) => {
  if (confidence >= 90) return 'critical';
  if (confidence >= 85) return 'high';
  if (confidence >= 50) return 'moderate';
  return 'low';
};

// Simple quadrant mapping — replace with real GeoJSON lookup if needed
const findZoneForCoordinates = (zones, x, z) => {
  if (x < -0.2 && z < -0.1) return zones.find(z => z.zoneName.includes('Zone B'));
  if (x < 0    && z >= -0.1) return zones.find(z => z.zoneName.includes('Zone A'));
  if (x >= 0   && z < 0)     return zones.find(z => z.zoneName.includes('Zone C'));
  return zones.find(z => z.zoneName.includes('Zone D'));
};


const processMLPrediction = async (prediction, zones) => {
  const { status, confidence, location_x, location_z,
          est_width, est_length, lidar_hits } = prediction;

  // Only act on hazard predictions
  if (status !== 'HAZARD') return null;

  const zone = findZoneForCoordinates(zones, location_x, location_z) || zones[0];
  if (!zone) {
    console.warn('[ML] No zone matched for prediction — skipping');
    return null;
  }

  const riskLevel = mapConfidenceToRiskLevel(confidence);

  const riskAssessment = await RiskAssessment.create({
    zoneId:             zone._id,
    riskLevel,
    confidenceScore:    confidence / 100,
    contributingSensors: [],
    modelVersion:       'ML-v1.0',
    detectionDetails: {
      lidarScore:    confidence / 100,
      seismicScore:  0,
      fusionWeights: { lidar: 1.0, seismic: 0 },
      rawPredictions: { location_x, location_z, est_width, est_length, lidar_hits },
    },
  });


  broadcastRiskUpdate({
    _id:            zone._id,
    zoneName:       zone.zoneName,
    riskLevel,
    confidenceScore: confidence / 100,
  });


  if (riskLevel === 'high' || riskLevel === 'critical') {
    await maybeGenerateAlert(zone, riskAssessment, riskLevel, confidence);
  } else {
    // Risk dropped below alert threshold — clear the cache so a future
    // escalation will correctly fire a fresh alert
    if (activeAlertCache.has(String(zone._id))) {
      console.log(`[ML] Zone ${zone.zoneName} risk dropped to ${riskLevel} — clearing alert cache`);
      activeAlertCache.delete(String(zone._id));
    }
  }

  return riskAssessment;
};



const maybeGenerateAlert = async (zone, riskAssessment, riskLevel, confidence) => {
  const zoneKey  = String(zone._id);
  const cached   = activeAlertCache.get(zoneKey);

  const isEscalation = cached && cached.riskLevel !== riskLevel && riskLevel === 'critical';
  const isFirstAlert = !cached;

  if (!isFirstAlert && !isEscalation) {
    // Same zone, same or lower severity — silently skip
    return;
  }

  if (isEscalation) {
    console.log(`[ML] Zone ${zone.zoneName} escalated ${cached.riskLevel} → ${riskLevel} — generating new alert`);
  }

  await generateAlert(zone, riskAssessment, riskLevel, confidence);
};

// Alert creation 

const generateAlert = async (zone, riskAssessment, riskLevel, confidence) => {
  try {
    const targets = await User.findAll({
      where:      { role: ['miner', 'planner', 'administrator'], active: true },
      attributes: ['id'],
    });

    const targetUserIds = targets.map(u => String(u.id));
    if (!targetUserIds.length) {
      console.warn('[ML] No active users to alert');
      return;
    }

    const alertLevel   = riskLevel === 'critical' ? 'critical' : 'danger';
    const alertMessage = riskLevel === 'critical'
      ? `CRITICAL HAZARD detected in ${zone.zoneName}. Confidence: ${confidence.toFixed(1)}%. Evacuate immediately and contact your supervisor.`
      : `High risk detected in ${zone.zoneName}. Confidence: ${confidence.toFixed(1)}%. Exercise extreme caution and avoid the area.`;

    const alert = await Alert.create({
      triggeredByAssessmentId: riskAssessment._id,
      alertLevel,
      affectedZoneIds:  [zone._id],
      targetUserIds,
      alertMessage,
      generatedAt:      new Date(),
      expiresAt:        new Date(Date.now() + 24 * 60 * 60 * 1000),
      acknowledgments:  [],
      deliveryStatus:   { websocket: [], email: [], failed: [] },
    });

    const delivered = broadcastAlert(alert.toObject());
    alert.deliveryStatus.websocket = delivered;
    await alert.save();

    // Cache so subsequent polls for this zone don't re-fire
    activeAlertCache.set(String(zone._id), {
      alertId:   String(alert._id),
      riskLevel,
      createdAt: Date.now(),
    });

    console.log(`[ML] Alert sent — ${zone.zoneName} (${riskLevel})`);
  } catch (err) {
    console.error('[ML] Failed to generate alert:', err.message);
  }
};


const fetchMLPredictions = async () => {
  try {
    const response = await axios.get(ML_API_URL, { timeout: 0 });
    const predictions = response.data;

    if (!Array.isArray(predictions)) {
      console.error('[ML] API did not return an array');
      return;
    }

    // Single DB call for zones — shared across all predictions this cycle
    const zones = await Zone.find();
    if (!zones.length) {
      console.warn('[ML] No zones in database — skipping cycle');
      return;
    }

    let processed = 0;
    for (const prediction of predictions) {
      const result = await processMLPrediction(prediction, zones);
      if (result) processed++;
    }

    if (processed > 0) {
      console.log(`[ML] Processed ${processed} hazard prediction(s)`);
    }
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn(`[ML] Inference API unavailable at ${ML_API_URL}`);
    } else {
      console.error('[ML] Fetch error:', err.message);
    }
  }
};

//Start polling

const startMLPolling = () => {
  console.log(`[ML] Polling inference API every ${POLLING_INTERVAL / 1000}s`);
  console.log(`[ML] Endpoint: ${ML_API_URL}`);

  fetchMLPredictions();
  setInterval(fetchMLPredictions, POLLING_INTERVAL);
};

module.exports = {
  fetchMLPredictions,
  startMLPolling,
  processMLPrediction,
};