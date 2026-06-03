const Incident = require('../models/mongodb/Incident');

// Get all incidents
exports.getAllIncidents = async (req, res, next) => {
  try {
    const { incidentType, severity, resolved, startDate, endDate } = req.query;

    const filter = {};
    if (incidentType) filter.incidentType = incidentType;
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const incidents = await Incident.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ incidents });
  } catch (error) {
    next(error);
  }
};

// Get incident by ID
exports.getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ incident });
  } catch (error) {
    next(error);
  }
};

// Get monthly incident stats for chart
exports.getMonthlyStats = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const stats = await Incident.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
            incidentType: '$incidentType',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Pivot into { month, rockfall, near_miss, false_alarm }
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun',
                        'Jul','Aug','Sep','Oct','Nov','Dec'];
    const map = {};

    for (const { _id, count } of stats) {
      const key = `${_id.year}-${_id.month}`;
      if (!map[key]) {
        map[key] = {
          month: monthNames[_id.month - 1],
          sortKey: _id.year * 100 + _id.month,
          rockfall: 0, near_miss: 0, false_alarm: 0,
        };
      }
      map[key][_id.incidentType] = count;
    }

    const data = Object.values(map)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...rest }) => rest);

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

// Get daily risk trend for the past 7 days
exports.getDailyRiskTrend = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await Incident.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$createdAt' }, // 1=Sun … 7=Sat
            date:      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            severity:  '$severity',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = {};

    for (const { _id, count } of stats) {
      const key = _id.date;
      if (!map[key]) {
        map[key] = {
          day: dayNames[_id.dayOfWeek - 1],
          sortKey: key,
          low: 0, moderate: 0, high: 0, critical: 0,
        };
      }
      map[key][_id.severity] = count;
    }

    const data = Object.values(map)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

// Create incident
exports.createIncident = async (req, res, next) => {
  try {
    const {
      location,
      incidentType,
      severity,
      description,
      investigationNotes,
      relatedAlertIds,
    } = req.body;

    const incident = await Incident.create({
      location,
      incidentType,
      severity,
      description,
      investigationNotes,
      relatedAlertIds,
      reportedBy: req.user.id,
    });

    res.status(201).json({ message: 'Incident reported', incident });
  } catch (error) {
    next(error);
  }
};

// Update incident
exports.updateIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ message: 'Incident updated', incident });
  } catch (error) {
    next(error);
  }
};