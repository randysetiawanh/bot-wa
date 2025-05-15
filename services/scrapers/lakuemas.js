const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function scrapeLakuEmas() {
  const url = 'https://lakuemas.com/';
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const jual = $('.class-yang-pas-untuk-jual').first().text().trim();
  const beli = $('.class-yang-pas-untuk-beli').first().text().trim();

  return {
    source: 'lakuemas',
    jual,
    beli
  };
};
