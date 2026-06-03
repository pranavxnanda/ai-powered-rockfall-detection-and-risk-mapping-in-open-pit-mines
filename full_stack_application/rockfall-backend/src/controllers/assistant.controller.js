const AIConversation = require('../models/mongodb/AIConversation');
const Zone = require('../models/mongodb/Zone');
const RiskAssessment = require('../models/mongodb/RiskAssessment');
const Alert = require('../models/mongodb/Alert');
const { generateResponse, getQuickResponse } = require('../services/gemini.service');

const buildRealtimeSafetyContext = async () => {
  const zones = await Zone.find();
  const enriched = await Promise.all(
    zones.map(async (zone) => {
      const latestRisk = await RiskAssessment.findOne({ zoneId: zone._id })
        .sort({ createdAt: -1 })
        .limit(1);

      return {
        zoneName: zone.zoneName,
        riskLevel: latestRisk?.riskLevel || 'low',
        confidenceScore: latestRisk?.confidenceScore || 0,
      };
    }),
  );

  const highRiskZones = enriched.filter((z) => z.riskLevel === 'high' || z.riskLevel === 'critical');
  const moderateRiskZones = enriched.filter((z) => z.riskLevel === 'moderate');
  const lowRiskZones = enriched.filter((z) => z.riskLevel === 'low');

  const alertDocs = await Alert.find({ acknowledged: false })
    .populate('affectedZoneIds', 'zoneName')
    .sort({ generatedAt: -1 })
    .limit(5);

  const activeAlerts = alertDocs.map((alert) => ({
    level: alert.alertLevel,
    message: alert.alertMessage,
    zones: alert.affectedZoneIds?.map((zone) => zone.zoneName).join(', ') || 'unknown',
  }));

  const summaryParts = [];
  if (highRiskZones.length) {
    summaryParts.push(
      `High/Critical hazard in ${highRiskZones
        .map((zone) => `${zone.zoneName} (${zone.riskLevel})`)
        .join(', ')}`,
    );
  }
  if (moderateRiskZones.length) {
    summaryParts.push(`Moderate risk in ${moderateRiskZones.map((zone) => zone.zoneName).join(', ')}`);
  }
  if (lowRiskZones.length) {
    summaryParts.push(`Safe/low-risk zones: ${lowRiskZones.map((zone) => zone.zoneName).join(', ')}`);
  }

  return {
    summary: summaryParts.length > 0 ? summaryParts.join(' | ') : 'All monitored zones are currently low risk.',
    highRiskZones: highRiskZones.map((zone) => zone.zoneName),
    safeZones: lowRiskZones.map((zone) => zone.zoneName),
    activeAlerts,
  };
};

// AI Assistant chat endpoint
exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Find or create conversation
    let conversation = await AIConversation.findOne({
      userId: req.user.id,
      conversationStatus: 'ongoing',
    }).sort({ lastInteraction: -1 });

    if (!conversation) {
      conversation = await AIConversation.create({
        userId: req.user.id,
        messages: [],
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      contextData: {
        role: req.user.role,
        timestamp: new Date(),
      },
    });

    // Check for quick response first (faster for common queries)
    let reply;
    const quickReply = getQuickResponse(message);
    
    if (quickReply) {
      reply = quickReply;
    } else {
      // Generate AI response using Gemini with real-time zone hazard context
      const conversationHistory = conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const safetyContext = await buildRealtimeSafetyContext();

      const context = {
        userRole: req.user.role,
        userName: req.user.fullName,
        zoneSafetySummary: safetyContext.summary,
        highRiskZones: safetyContext.highRiskZones,
        safeZones: safetyContext.safeZones,
        activeAlerts: safetyContext.activeAlerts,
      };

      try {
        reply = await generateResponse(conversationHistory, context);
      } catch (error) {
        console.warn('Gemini failed, using safety-summary fallback:', error.message);
        reply = `Gemini is temporarily unavailable. Current hazard summary: ${safetyContext.summary}. Please avoid high-risk zones and contact your supervisor if you need help.`;
      }
    }

    // Add assistant message
    conversation.messages.push({
      role: 'assistant',
      content: reply,
      contextData: {
        model: quickReply ? 'quick_response' : 'gemini-fallback',
        timestamp: new Date(),
      },
    });

    // Keep only last 20 messages to avoid token limits
    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20);
    }

    conversation.lastInteraction = new Date();
    await conversation.save();

    res.json({ reply });
  } catch (error) {
    console.error('AI Assistant error:', error);
    
    // Return a graceful error message
    res.status(200).json({
      reply: 'I apologize, but I\'m having trouble processing your request right now. For immediate assistance, please contact your supervisor or safety officer. You can also check the risk map for current zone conditions.',
    });
  }
};

// Get conversation history
exports.getHistory = async (req, res, next) => {
  try {
    const conversations = await AIConversation.find({ userId: req.user.id })
      .sort({ lastInteraction: -1 })
      .limit(10)
      .select('messages lastInteraction conversationStatus');

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

// Clear/End current conversation
exports.endConversation = async (req, res, next) => {
  try {
    await AIConversation.updateMany(
      { userId: req.user.id, conversationStatus: 'ongoing' },
      { conversationStatus: 'completed' }
    );

    res.json({ message: 'Conversation ended' });
  } catch (error) {
    next(error);
  }
};