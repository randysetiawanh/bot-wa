const puppeteer = require('puppeteer');
const logger = require('../../utils/logger');

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
    await page.goto('https://www.logammulia.com/id/harga-emas-hari-ini', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForSelector('table');

    const jual = await page.evaluate(() => {
      return document.querySelector(
        "body > section.section-padding.n-no-padding-top > div > div:nth-child(3) > div > div.grid-child.n-768-1per3.n-768-no-margin-bottom > table:nth-child(4) > tbody > tr:nth-child(4) > td:nth-child(2)"
      )?.innerText.trim() || '-';
    });

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
      jual: clean(jual || ''),
      buyback: clean(buyback || '')
    };
  } catch (error) {
    await browser.close();
    console.error("❌ Error scraping logammulia:", error.message);
    return {
      source: 'logammulia.com',
      jual: '-1',
      buyback: '-1'
    };
  }
};
