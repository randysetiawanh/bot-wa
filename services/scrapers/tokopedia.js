const puppeteer = require('puppeteer');
const logger = require('../../utils/logger');

module.exports = async function scrapeTokopediaEmas() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  try {
    await page.goto('https://www.tokopedia.com/emas/harga-hari-ini/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForSelector('h3'); // pastikan selector yang cocok

    const result = await page.evaluate(() => {
      const prices = Array.from(document.querySelectorAll('p'))
        .map(el => el.innerText)
        .filter(t => t.includes('Rp'));
      
      const clean = text => text.replace(/Rp|\s|\/gr/g, '');
      console.log(prices);
      return {
        source: 'tokopedia.com',
        jual: clean(prices[0] || ''),
        buyback: clean(prices[1] || ''),
      };
    });

    await browser.close();
    return result;
  } catch (error) {
    await browser.close();
    console.error('[ERROR] Error scraping scrapeTokopedia:', error.message);
    return null;
  }
};
