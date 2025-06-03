const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

// Buat format log
const logFormat = format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

// Ambil bulan sekarang (MM)
const now = new Date();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // '06'

// Buat folder logs/MM jika belum ada
const logDir = path.join(__dirname, 'logs', currentMonth);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Buat logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.File({
      filename: path.join('logs', 'bot-error.log'),
      level: 'error'
    }),
    new transports.File({
      filename: path.join('logs', 'bot-combined.log')
    }),

    // File log harian di folder bulan
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'bot-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: false
    })
  ]
});

module.exports = logger;
