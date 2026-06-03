const User = require('../models/sql/User');
const UserSession = require('../models/sql/UserSession');

// Get all users (admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, active } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === 'true';

    const users = await User.findAll({
      where: filter,
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent non-admins from updating other users
    if (req.user.role !== 'administrator' && req.user.id !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Don't allow changing password through this endpoint
    const { password, passwordHash, ...updateData } = req.body;

    await user.update(updateData);

    res.json({
      message: 'User updated',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        active: user.active,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get assignable users for work assignment dropdown
exports.getAssignableUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { active: true, role: 'miner' },
      attributes: ['id', 'username', 'fullName', 'role'],
      order: [['fullName', 'ASC']],
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// Delete user (hard delete)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated user sessions first
    await UserSession.destroy({
      where: { userId: req.params.id },
    });

    // Then delete the user
    await user.destroy();

    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};