const morgan = require('morgan');
const logger = require('../config/logger');

// Pipe morgan's HTTP access logs into winston so everything ends up in the
// same log files, rather than having two separate logging systems.
const stream = {
  write: (message) => logger.info(message.trim()),
};

const requestLogger = morgan(
  ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream }
);

module.exports = requestLogger;
