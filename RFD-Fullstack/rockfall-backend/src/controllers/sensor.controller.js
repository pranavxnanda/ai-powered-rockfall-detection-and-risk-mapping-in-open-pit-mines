const Sensor = require('../models/mongodb/Sensor');

// Get all sensors
exports.getAllSensors = async (req, res, next) => {
  try {
    const { sensorType, status } = req.query;

    const filter = {};
    if (sensorType) filter.sensorType = sensorType;
    if (status) filter.status = status;

    const sensors = await Sensor.find(filter).sort({ sensorId: 1 });

    res.json({ sensors });
  } catch (error) {
    next(error);
  }
};

// Get sensor by ID
exports.getSensorById = async (req, res, next) => {
  try {
    const sensor = await Sensor.findById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    res.json({ sensor });
  } catch (error) {
    next(error);
  }
};

// Create sensor
exports.createSensor = async (req, res, next) => {
  try {
    const {
      sensorId,
      sensorType,
      location,
      calibrationParameters,
      metadata,
    } = req.body;

    const sensor = await Sensor.create({
      sensorId,
      sensorType,
      location,
      calibrationParameters,
      metadata,
    });

    res.status(201).json({ message: 'Sensor created', sensor });
  } catch (error) {
    next(error);
  }
};

// Update sensor
exports.updateSensor = async (req, res, next) => {
  try {
    const sensor = await Sensor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastCommunication: new Date() },
      { new: true, runValidators: true }
    );

    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    res.json({ message: 'Sensor updated', sensor });
  } catch (error) {
    next(error);
  }
};

// Delete sensor
exports.deleteSensor = async (req, res, next) => {
  try {
    const sensor = await Sensor.findByIdAndDelete(req.params.id);
    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    res.json({ message: 'Sensor deleted' });
  } catch (error) {
    next(error);
  }
};