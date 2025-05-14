const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const path = require('path');

const logFormat = format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.File({ filename: 'logs/bot-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/bot-combined.log' }),

    // Optional: rotate harian
    new transports.DailyRotateFile({
      filename: 'logs/bot-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d' // simpan 14 hari terakhir
    })
  ]
});

module.exports = logger;
