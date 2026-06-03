const WorkAssignment = require('../models/mongodb/WorkAssignment');
const Zone = require('../models/mongodb/Zone');
const User = require('../models/sql/User');

const attachAssignedUsers = async (assignment) => {
  const assignmentObj = assignment.toObject ? assignment.toObject() : assignment;
  const assignedUserIds = Array.isArray(assignmentObj.assignedUserIds)
    ? assignmentObj.assignedUserIds.filter((id) => Number.isInteger(id))
    : [];

  if (assignedUserIds.length === 0) {
    return { ...assignmentObj, assignedUsers: [] };
  }

  const users = await User.findAll({
    where: { id: assignedUserIds },
    attributes: ['id', 'fullName', 'username', 'role'],
  });

  const userMap = users.reduce((map, user) => {
    map[user.id] = user;
    return map;
  }, {});

  const assignedUsers = assignedUserIds.map((id) => {
    return userMap[id] || { id, fullName: `User ${id}`, username: null, role: null };
  });

  return { ...assignmentObj, assignedUsers };
};

const attachAssignedUsersToList = async (assignments) => {
  return Promise.all(assignments.map((assignment) => attachAssignedUsers(assignment)));
};

// Get all work assignments
exports.getAllAssignments = async (req, res, next) => {
  try {
    const { status, zoneId, userId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (zoneId) filter.zoneId = zoneId;
    if (userId) filter.assignedUserIds = parseInt(userId);

    const assignments = await WorkAssignment.find(filter)
      .populate('zoneId', 'zoneName zoneType')
      .sort({ scheduledStart: -1 });

    const assignmentsWithUsers = await attachAssignedUsersToList(assignments);
    res.json({ assignments: assignmentsWithUsers });
  } catch (error) {
    next(error);
  }
};

// Get my assignments (for current user)
exports.getMyAssignments = async (req, res, next) => {
  try {
    const assignments = await WorkAssignment.find({
      assignedUserIds: req.user.id,
    })
      .populate('zoneId', 'zoneName zoneType')
      .sort({ scheduledStart: -1 });

    const assignmentsWithUsers = await attachAssignedUsersToList(assignments);
    res.json({ assignments: assignmentsWithUsers });
  } catch (error) {
    next(error);
  }
};

// Create work assignment
exports.createAssignment = async (req, res, next) => {
  try {
    const {
      assignedUserIds,
      zoneId,
      scheduledStart,
      scheduledEnd,
      workType,
      requiredEquipment,
    } = req.body;

    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }

    const assignment = await WorkAssignment.create({
      assignedUserIds,
      zoneId,
      scheduledStart,
      scheduledEnd,
      workType,
      requiredEquipment,
    });

    const populated = await attachAssignedUsers(assignment);
    res.status(201).json({ message: 'Assignment created', assignment: populated });
  } catch (error) {
    next(error);
  }
};

// Update assignment
exports.updateAssignment = async (req, res, next) => {
  try {
    const assignment = await WorkAssignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('zoneId', 'zoneName zoneType');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const populated = await attachAssignedUsers(assignment);
    res.json({ message: 'Assignment updated', assignment: populated });
  } catch (error) {
    next(error);
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await WorkAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    next(error);
  }
};