const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeHargaEmas() {
  const url = 'https://www.hargaemas.com/';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const jual = $('.price-current').eq(1).text().trim();
  const buyback = $('.price-current').eq(2).text().trim();

  return {
    source: 'hargaemas.com',
    jual,
    buyback
  };
};
