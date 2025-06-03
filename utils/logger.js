const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const logFormat = format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

// Buat folder log jika belum ada
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// Winston logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.File({ filename: 'logs/bot-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/bot-combined.log' }),

    // Daily rotation per bulan
    new transports.DailyRotateFile({
      // Struktur: logs/MM/bot-YYYY-MM-DD.log
      filename: path.join('logs', '%MM', 'bot-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',

      // Custom formatter untuk %MM
      dirname: '.', // agar path.join bekerja dari root proyek
      createSymlink: false,
      format: format.combine(
        format((info) => {
          // Custom token untuk MM
          const month = new Date().toISOString().slice(5, 7);
          info.MM = month;
          return info;
        })(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    })
  ]
});

module.exports = logger;
