const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../cache/goldPrice.json');
const TIME_CACHE_FILE = path.join(__dirname, '../cache/goldScrapeTime.json');

function readCache() {
  return fs.existsSync(CACHE_FILE)
    ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    : {};
}

function writeCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

function readTimeCache(source) {
  const cache = fs.existsSync(TIME_CACHE_FILE)
    ? JSON.parse(fs.readFileSync(TIME_CACHE_FILE, 'utf-8'))
    : {};

  return cache[source] || null;
}

function writeTimeCache(source, timestamp) {
  const cache = fs.existsSync(TIME_CACHE_FILE)
    ? JSON.parse(fs.readFileSync(TIME_CACHE_FILE, 'utf-8'))
    : {};

  cache[source] = timestamp;

  fs.writeFileSync(TIME_CACHE_FILE, JSON.stringify(cache, null, 2));
}

function parseRupiah(str) {
  return parseInt(str.replace(/\./g, '').replace('Rp', '').replace('/gr', '').trim(), 10);
}

function formatSelisih(curr, prev) {
  if (prev === null) return '';
  const diff = curr - prev;
  if (diff === 0) return '';
  const sign = diff > 0 ? '+' : '-';
  return ` | Selisih harga: ${sign} Rp ${Math.abs(diff).toLocaleString('id-ID')}`;
}

module.exports = {
  readCache,
  writeCache,
  readTimeCache,
  writeTimeCache,
  parseRupiah,
  formatSelisih
};
