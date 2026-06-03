const User = require('../models/sql/User');
const UserSession = require('../models/sql/UserSession');
const { generateToken } = require('../utils/jwt.utils');

// Registers new user
exports.register = async (req, res, next) => {
  try {
    const { username, password, role, fullName, email, phoneNumber } = req.body;

    // Checks if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Creates user
    const user = await User.create({
      username,
      passwordHash: password, // Will be hashed by beforeCreate hook
      role: role || 'miner',
      fullName,
      email,
      phoneNumber,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if active
    if (!user.active) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken({ id: user.id, role: user.role });

    // Create session
    await UserSession.create({
      userId: user.id,
      jwtToken: token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify token
exports.verify = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        fullName: req.user.fullName,
        email: req.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await UserSession.update(
        { active: false },
        { where: { jwtToken: token } }
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};