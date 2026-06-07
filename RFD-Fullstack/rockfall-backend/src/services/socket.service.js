const jwt = require('jsonwebtoken');

let io = null;

const initializeSocket = (socketIO) => {
  io = socketIO;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.join(`user_${decoded.id}`);
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}, user: ${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

// Broadcast risk update to all connected clients
const broadcastRiskUpdate = (zone) => {
  if (io) {
    io.emit('risk_update', zone);
    console.log(`Risk update broadcasted for zone: ${zone.zoneName}`);
  }
};

// Broadcast alert to specific users
const broadcastAlert = (alert) => {
  if (!io) return [];

  const delivered = [];

  alert.targetUserIds.forEach((userId) => {
    io.to(`user_${userId}`).emit('new_alert', alert);
    delivered.push(userId);
  });

  console.log(`Alert broadcasted to ${delivered.length} users`);
  return delivered;
};

module.exports = { 
  initializeSocket, 
  broadcastRiskUpdate, 
  broadcastAlert 
};