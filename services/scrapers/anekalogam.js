const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeAnekaLogam() {
  const url = 'https://anekalogam.co.id/';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const cleanHarga = (str) =>
    str.replace('Rp', '').trim();

  const jual = $('span.tprice').eq(0).text().trim();
  const buyback = $('span.tprice').eq(1).text().trim();

  return {
    source: 'anekalogam',
    jual: cleanHarga(jual),
    buyback: cleanHarga(buyback),
  };
};
