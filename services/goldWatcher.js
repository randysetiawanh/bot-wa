const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');
const waSendMessage = require('./whatsappSendMessage');
const scrapers = [
  require('./scrapers/hargaemas'),
  require('./scrapers/anekalogam'),
  require('./scrapers/hargaemasnet'),
  require('./scrapers/tokopedia')
];

const CACHE_FILE = path.join(__dirname, '../cache/goldPrice.json');

function readCache() {
  return fs.existsSync(CACHE_FILE)
    ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    : {};
}

function parseRupiah(str) {
  return parseInt(str.replace(/\./g, ''), 10);
}

function formatSelisih(curr, prev) {
  if (prev === null) return '';
  const diff = curr - prev;
  if (diff === 0) return '';
  const sign = diff > 0 ? '+' : '-';
  return ` | Selisih harga: ${sign} Rp ${Math.abs(diff).toLocaleString('id-ID')}`;
}

function buildMessage(data, cache, isScheduledTime) {
  const header = isScheduledTime ? '~~~ UPDATE HARGA SIANG ~~~\n' : '';
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

  return header + lines.join('\n\n');
}

async function checkHargaEmas() {
  const cachedData = readCache();
  const newData = {};
  let hasChanged = false;

  for (const scraper of scrapers) {
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
      fs.writeFileSync(CACHE_FILE, JSON.stringify(newData, null, 2));
      logger.info('Harga emas berubah, pesan dikirim');
    } else {
      logger.info('Harga tetap, tapi pesan dikirim karena jam 12 siang');
    }
  } else if (now.getMinutes() === 0) {
    logger.info('Harga emas tidak berubah');
  }
}

module.exports = function startGoldWatcher() {
  logger.info('📡 Memulai watcher harga emas...');
  console.log('📡 Memulai watcher harga emas...');
  checkHargaEmas();
  setInterval(checkHargaEmas, config.goldInterval);
};
