require('dotenv').config();
const logger = require('./utils/logger');
const startAbsenScheduler = require('./services/absenScheduler');
const startEmasWatcher = require('./services/emasWatcher');

logger.info('🚀 Bot WA starting...');
startEmasWatcher();
startAbsenScheduler();
