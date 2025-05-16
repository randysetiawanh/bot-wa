const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');
const hargaemas = require('./scrapers/hargaemas');
const anekalogam = require('./scrapers/anekalogam');
const lakuemas = require('./scrapers/lakuemas');
const waSendMessage = require('./whatsappSendMessage');

const CACHE_FILE = path.join(__dirname, '../cache/goldPrice.json');

const scrapers = [hargaemas, anekalogam];

async function checkHargaEmas() {
  let cachedData = {};
  if (fs.existsSync(CACHE_FILE)) {
    cachedData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }

  let hasChanged = false;
  const newData = {};

  for (const scraper of scrapers) {
    try {
      const result = await scraper();
      const { source, jual, buyback } = result;

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
    let message = '';
    if(isScheduledTime){
      message += '~~~ UPDATE HARGA SIANG ~~~\n';
    }
    message += Object.entries(newData)
      .map(([source, { jual, buyback }]) => {
        const cached = cachedData[source] || {};

        const jualNow = parseInt(jual.replace(/\./g, ''), 10);
        const buybackNow = parseInt(buyback.replace(/\./g, ''), 10);

        const cachedJual = cached.jual ? parseInt(cached.jual.replace(/\./g, ''), 10) : null;
        const cachedBuyback = cached.buyback ? parseInt(cached.buyback.replace(/\./g, ''), 10) : null;

        const selisihJual = cachedJual !== null ? jualNow - cachedJual : null;
        const selisihBuyback = cachedBuyback !== null ? buybackNow - cachedBuyback : null;

        const formatSelisih = (angka) => {
          if (angka === null) return '(data awal)';
          if (angka === 0) return 'Rp. 0';
          const prefix = angka > 0 ? '+ Rp ' : '- Rp ';
          return prefix + Math.abs(angka).toLocaleString('id-ID');
        };

        return `🧈 *${source.toUpperCase()}* 🧈\n💰 Jual: Rp ${jual} | Selisih harga sebelumnya : ${formatSelisih(selisihJual)}\n💰 Buyback: Rp ${buyback} | Selisih harga sebelumnya : ${formatSelisih(selisihBuyback)}`;
      })
      .join('\n\n');

    await waSendMessage(message, 'Update Harga Emas');

    if (hasChanged) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(newData, null, 2));
      logger.info('Harga emas berubah, pesan dikirim');
    } else {
      logger.info('Harga tetap, tapi pesan dikirim karena jam 12 siang');
    }
  } else {
    // Supaya tidak terlalu nyampah di logger
    if(now.getMinutes() === 0)
      logger.info('Harga emas tidak berubah');
  }
}

module.exports = function startEmasWatcher() {
  logger.info('📡 Memulai watcher harga emas...');

  // Jalankan langsung saat start
  checkHargaEmas();

  // Jalankan tiap interval
  setInterval(checkHargaEmas, config.goldInterval);
};
