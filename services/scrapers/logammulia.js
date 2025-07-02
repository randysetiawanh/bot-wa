const puppeteer = require('puppeteer');
const logger = require('../../utils/logger');
const dumpHTML = require('../../utils/htmlDumper');

module.exports = async function scrapeLogamMulia(getSourceOnly = false) {
  if(getSourceOnly) {
    return { source: 'logammulia.com' };
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const page2 = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );
  await page2.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  try {
    // Get sell price
    await page.goto('https://www.logammulia.com/id', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForSelector('section.index-hero span.current'); 
    const jual = await page.evaluate(() => {
      const text = document.querySelector(
        "body > section.index-hero > div.hero-price > div.child.child-2.has-bg.has-overlay.overlay-gold > div > p.price > span.current"
      )?.innerText || '';
    
      const match = text.match(/Rp(\d{1,3}(?:\.\d{3})+)/);
      return match ? match[1] : '-';
    });

    // Get buyback price
    await page2.goto('https://www.logammulia.com/id/sell/gold', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page2.waitForSelector('span.value > span.text');
    const buyback = await page2.evaluate(() => {
      return document.querySelector(
        'body > section.section-padding.n-no-padding-bottom > div > div > div.grid-child.n-1200-2per3.n-no-margin-bottom > div > div > div.right > div > div:nth-child(1) > span.value > span.text'
      )?.innerText.trim() || '-';
    });

    await browser.close();

    const clean = text => text.replace(/Rp\s?|\./g, '').replace(/,/g, '.');

    return {
      source: 'logammulia.com',
      jual: jual || '-1',
      buyback: clean(buyback || '-1')
    };
  } catch (error) {
    const html = await page.content();
    const html2 = await page2.content();
    dumpHTML('logammulia', html, true);
    dumpHTML('logammulia', html2, false);
    await browser.close();
    logger.error("❌ Error scraping logammulia:", error.message);
    return {
      source: 'logammulia.com',
      jual: '-1',
      buyback: '-1'
    };
  }
};
