const { verifyToken } = require('../utils/jwt.utils');
const User = require('../models/sql/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    
    // Fetches user from SQL database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };