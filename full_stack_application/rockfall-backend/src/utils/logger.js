const morgan = require('morgan');

const logger = morgan(
  process.env.NODE_ENV === 'development' ? 'dev' : 'combined'
);

module.exports = logger;