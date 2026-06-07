const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema({
  userId: {
    type: Number, 
    required: true,
    index: true,
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    contextData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  }],
  conversationStatus: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing',
  },
  lastInteraction: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

aiConversationSchema.index({ userId: 1, lastInteraction: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);