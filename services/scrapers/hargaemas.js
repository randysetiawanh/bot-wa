const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeHargaEmas() {
  const url = 'https://www.hargaemas.com/';

  try {
    console.log(`[INFO] Memulai request ke ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });
    console.log("here");

    const $ = cheerio.load(response.data);

    const jual = $('.price-current').eq(1).text().trim();
    const buyback = $('.price-current').eq(2).text().trim();

    console.log(`[INFO] Data berhasil diambil. Jual: ${jual}, Buyback: ${buyback}`);

    return {
      source: 'hargaemas.com',
      jual,
      buyback
    };
  } catch (error) {
    console.error(`[ERROR] Terjadi kesalahan saat scraping: ${error}`);
    return null;
  }
};