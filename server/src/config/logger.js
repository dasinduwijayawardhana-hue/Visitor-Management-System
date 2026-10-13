const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const env = require('./env');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack || message}`;
  })
);

// Rotates daily, keeps 14 days of history, separate files for errors.
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

const errorFileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

const logger = winston.createLogger({
  level: env.logLevel,
  transports: [fileRotateTransport, errorFileRotateTransport],
  exitOnError: false,
});

// Pretty console output in development only.
if (env.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}

module.exports = logger;
