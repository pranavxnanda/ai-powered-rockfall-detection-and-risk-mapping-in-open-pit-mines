const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-mini';
const MAX_RETRY_ATTEMPTS = parseInt(process.env.GEMINI_RETRY_COUNT, 10) || 2;
const RETRY_DELAY_MS = parseInt(process.env.GEMINI_RETRY_DELAY_MS, 10) || 1000;

// System prompt for RFD AI Assistant
const SYSTEM_PROMPT = `You are RFD AI, an intelligent safety assistant for an open-pit mining operation. Your role is to provide helpful, accurate, and safety-focused guidance to miners, planners, and administrators.

Your capabilities include:
- Providing safety procedures and protocols
- Explaining risk levels and hazard information
- Guiding users through emergency evacuation procedures
- Answering questions about required safety equipment
- Offering advice on work assignments and zone safety
- Explaining incident reporting procedures
- Using the latest real-time zone hazard and ML model risk data when answering zone safety questions

Guidelines:
- Always prioritize safety in your responses
- Be clear, concise, and actionable
- Use simple language that's easy to understand in field conditions
- If you don't know something specific to this mine site, acknowledge it and suggest contacting a supervisor
- Never provide information that could compromise safety
- Be empathetic and supportive, especially in emergency situations

Keep responses under 150 words unless detailed instructions are needed for safety.`;

/**
 * Generate AI response using Gemini
 * @param {Array} conversationHistory - Array of {role: 'user'|'assistant', content: string}
 * @param {Object} context - Optional context like user role, location, current risk levels
 * @returns {Promise<string>} - AI response
 */
async function generateResponse(conversationHistory, context = {}) {
  const messages = [...conversationHistory];
  if (context && Object.keys(context).length > 0) {
    const lastMessageIndex = messages.length - 1;
    const contextInfo = formatContext(context);
    messages[lastMessageIndex] = {
      ...messages[lastMessageIndex],
      content: `${contextInfo}\n\nUser question: ${messages[lastMessageIndex].content}`,
    };
  }

  const geminiHistory = messages.slice(0, -1).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const latestMessage = messages[messages.length - 1].content;

  async function sendWithModel(modelName) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(latestMessage);
    return result.response.text();
  }

  const isRetryable = (error) => {
    const status = error.status || error.statusCode || error?.response?.status;
    return (
      status === 503 ||
      status === 429 ||
      error.message?.includes('Service Unavailable') ||
      error.message?.includes('high demand')
    );
  };

  const attemptModel = async (modelName) => {
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
      try {
        return await sendWithModel(modelName);
      } catch (error) {
        if (attempt === MAX_RETRY_ATTEMPTS - 1 || !isRetryable(error)) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
    throw new Error('Gemini retry failed');
  };

  try {
    return await attemptModel(PRIMARY_MODEL);
  } catch (primaryError) {
    console.warn(`Primary model ${PRIMARY_MODEL} failed, trying fallback model ${FALLBACK_MODEL}`);
    if (FALLBACK_MODEL && FALLBACK_MODEL !== PRIMARY_MODEL) {
      try {
        return await attemptModel(FALLBACK_MODEL);
      } catch (fallbackError) {
        console.error(`Fallback model ${FALLBACK_MODEL} failed:`, fallbackError);
        if (fallbackError.message?.includes('API key')) {
          throw new Error('AI Assistant configuration error. Please contact administrator.');
        }
        throw new Error('AI Assistant is temporarily unavailable. Please try again or contact your supervisor.');
      }
    }

    if (primaryError.message?.includes('API key')) {
      throw new Error('AI Assistant configuration error. Please contact administrator.');
    }
    throw new Error('AI Assistant is temporarily unavailable. Please try again or contact your supervisor.');
  }
}

/**
 * Format context information for the AI
 */
function formatContext(context) {
  const parts = [];
  
  if (context.userRole) {
    parts.push(`User role: ${context.userRole}`);
  }
  
  if (context.currentZone) {
    parts.push(`Current zone: ${context.currentZone}`);
  }
  
  if (context.riskLevel) {
    parts.push(`Current risk level: ${context.riskLevel}`);
  }
  
  if (context.zoneSafetySummary) {
    parts.push(`Zone safety summary: ${context.zoneSafetySummary}`);
  }

  if (context.highRiskZones && context.highRiskZones.length > 0) {
    parts.push(`High-risk zones: ${context.highRiskZones.join(', ')}`);
  }

  if (context.safeZones && context.safeZones.length > 0) {
    parts.push(`Safe zones: ${context.safeZones.join(', ')}`);
  }
  
  if (context.activeAlerts && context.activeAlerts.length > 0) {
    parts.push(`Active alerts: ${context.activeAlerts.length}`);
  }
  
  if (parts.length === 0) return '';
  
  return `[Context: ${parts.join(', ')}]`;
}

/**
 * Quick safety response for common queries (cached responses for speed)
 */
const quickResponses = {
  evacuation: "In case of emergency:\n1. Stop work immediately\n2. Alert nearby workers\n3. Proceed to the nearest designated safe zone (marked with green signs)\n4. Follow your team leader's instructions\n5. Do not re-enter the area until cleared by safety officer\n\nEmergency number: Contact your supervisor immediately.",
  
  equipment: "Required safety equipment:\n• Hard hat (mandatory)\n• Safety glasses/goggles\n• High-visibility vest\n• Steel-toe boots\n• Gloves (work-appropriate)\n• Dust mask (if needed)\n• Ear protection (in high-noise areas)\n\nInspect all equipment before use and report damage immediately.",
  
  reporting: "To report an incident:\n1. Ensure immediate safety of all personnel\n2. Notify your supervisor immediately\n3. Use the 'Report Incident' feature in the app\n4. Provide location, type, and description\n5. Do not disturb evidence if safe\n6. Fill out incident form within 24 hours\n\nFor emergencies, call site emergency number first.",
};

/**
 * Check if query matches a quick response
 */
function getQuickResponse(query) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('evacuat') || lowerQuery.includes('emergency')) {
    return quickResponses.evacuation;
  }
  
  if (lowerQuery.includes('equipment') || lowerQuery.includes('ppe') || lowerQuery.includes('gear')) {
    return quickResponses.equipment;
  }
  
  if (lowerQuery.includes('report') && lowerQuery.includes('incident')) {
    return quickResponses.reporting;
  }
  
  return null;
}

module.exports = {
  generateResponse,
  getQuickResponse,
};