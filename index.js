require('dotenv').config();
global.crypto = require('crypto');
const logger = require('./utils/logger');
const startAbsenScheduler = require('./services/absenScheduler');
const startGoldWatcher = require('./services/goldWatcher');

logger.info('🚀 Bot WA starting...');
console.log('🚀 Bot WA starting...');
startGoldWatcher();
startAbsenScheduler();
