const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { cronMatch } = require('../utils/cronMatcher');
const waSendMessage = require('./whatsappSendMessage');
const { goldScheduleList } = require('../data/goldScheduleList');
const frequentScrapers = [
  require('./scrapers/hargaemas'),
  require('./scrapers/anekalogam'),
  require('./scrapers/hargaemasnet'),
  require('./scrapers/tokopedia'),
];

const delayedScrapers = [
  require('./scrapers/logammulia'),
];

const { readCache, writeCache, readTimeCache, 
  writeTimeCache, parseRupiah, formatSelisih 
} = require('../helpers/goldHelper');

const CACHE_FILE = path.join(__dirname, '../cache/goldPrice.json');
const TIME_CACHE_FILE = path.join(__dirname, '../cache/goldScrapeTime.json');

async function checkHargaEmas() {
  const date = new Date();
  const schedule = goldScheduleList.find(s => cronMatch(s.time, date));
  if (!schedule) {
    logger.info(`⏰ Waktu gacocok: "${schedule}"`);
    return;
  }

  logger.info(`⏰ Waktu cocok: "${schedule.message}" (${schedule.time})`);

  const cachedData = readCache();
  const newData = {};
  let hasChanged = false;

  for (const scraper of delayedScrapers) {
    const { source: sourceName } = await scraper(true);
    console.log('source : ', sourceName)
    const timeCache = readTimeCache();
    const lastScrapeTime = timeCache[sourceName]?.timestamp || null;
    const now = Date.now();
    const DELAYED_TIMEOUT = parseInt(process.env.DELAYED_TIMEOUT || '3600000', 10);
    const isDue = !lastScrapeTime || now - lastScrapeTime > DELAYED_TIMEOUT;
    if (!isDue) {
      if (cachedData[sourceName]) {
        newData[sourceName] = cachedData[sourceName];
      }
      continue;
    }

    try {
      const { source, jual, buyback } = await scraper();
      if (jual === '-1' || buyback === '-1') {
        logger.warn(`⚠️ Scrap ${source} gagal atau diblok, pakai data cache`);
        if (cachedData[source]) {
          newData[source] = cachedData[source];
        }
        continue;
      }
        
      newData[source] = { jual, buyback };
      writeTimeCache(sourceName, now);

      if (
        !cachedData[source] ||
        cachedData[source].jual !== jual ||
        cachedData[source].buyback !== buyback
      ) {
        hasChanged = true;
      }
    } catch (err) {
      logger.error(`Error scraping ${scraper.name}:`, err);
    }
  }

  for (const scraper of frequentScrapers) {
    try {
      const { source, jual, buyback } = await scraper();
      newData[source] = { jual, buyback };

      if (
        !cachedData[source] ||
        cachedData[source].jual !== jual ||
        cachedData[source].buyback !== buyback
      ) {
        hasChanged = true;
      }
    } catch (err) {
      logger.error(`Error scraping ${scraper.name}:`, err);
    }
  }

  const now = new Date();
  const { hour, minute } = config.goldForceSendHour;
  const isScheduledTime = now.getHours() === hour && now.getMinutes() === minute;

  if (hasChanged || isScheduledTime) {
    const message = buildMessage(newData, cachedData, isScheduledTime);
    await waSendMessage(message, 'Update Harga Emas');

    if (hasChanged) {
      writeCache(newData);
      logger.info('Harga emas berubah, pesan dikirim');
    } else {
      logger.info('Harga tetap, tapi pesan dikirim karena jam 12 siang');
    }
  } else if (now.getMinutes() === 0) {
    logger.info('Harga emas tidak berubah');
  }
}

function buildMessage(data, cache, isScheduledTime) {
  const header = process.env.NODE_ENV == 'production' ? '--- DIKIRIM DARI SERVER ---\n' : '--- DIKIRIM DARI LOKAL ---\n';
  const subheader = isScheduledTime ? '~~~ UPDATE HARGA SIANG ~~~\n' : '';
  const lines = Object.entries(data).map(([source, { jual, buyback }]) => {
    const cached = cache[source] || {};
    const jualNow = parseRupiah(jual);
    const buybackNow = parseRupiah(buyback);
    const jualPrev = cached.jual ? parseRupiah(cached.jual) : null;
    const buybackPrev = cached.buyback ? parseRupiah(cached.buyback) : null;

    return `🧈 *${source.toUpperCase()}* 🧈\n` +
      `💰 Jual: Rp ${jual}${formatSelisih(jualNow, jualPrev)}\n` +
      `💰 Buyback: Rp ${buyback}${formatSelisih(buybackNow, buybackPrev)}`;
  });

  return header + subheader + lines.join('\n\n');
}

module.exports = function startGoldWatcher() {
  logger.info('📡 Memulai watcher harga emas...');
  console.log('📡 Memulai watcher harga emas...');
  checkHargaEmas();
  setInterval(checkHargaEmas, config.goldInterval);
};