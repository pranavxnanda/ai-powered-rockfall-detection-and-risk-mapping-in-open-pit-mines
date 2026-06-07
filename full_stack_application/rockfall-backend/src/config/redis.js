const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;

const connectRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis unavailable, running without cache');
          return null; 
        }
        return Math.min(times * 50, 2000);
      },
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.warn('Redis error:', err.message);
    });

    return redisClient;
  } catch (error) {
    console.warn('Redis not available, continuing without cache');
    return null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };