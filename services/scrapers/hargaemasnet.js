const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeHargaEmas() {
  const url = 'https://harga-emas.net/';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  // Ambil harga buyback dari baris "Harga buyback"
  const buybackText = $('table:contains("Harga buyback") th').first().text();
  const buyback = buybackText.match(/\d[\d\.]+/)[0];

  // Ambil harga jual dari baris dengan "1 gr"
  const jual = $('table:contains("Harga buyback") tr')
    .filter((i, el) => $(el).find('td').first().text().trim() === '1 gr')
    .find('td').eq(1).text().match(/\d[\d\.]+/)[0];

  return {
    source: 'hargaemasnet',
    jual,
    buyback
  };
};
