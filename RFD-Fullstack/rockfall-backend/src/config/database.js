const {Sequelize} =  require('sequelize');
const mongoose = require('mongoose');
require('dotenv').config();

//--SQL
const sequelize = new Sequelize(
  process.env.SQL_DATABASE,
  process.env.SQL_USER,
  process.env.SQL_PASSWORD,
  {
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
); 

//--Mongo
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};


//--Test

const connectSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully');
     await sequelize.sync();
    console.log('SQL tables synced');
  } catch (error) {
    console.error('MySQL connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectMongoDB, connectSQL };
