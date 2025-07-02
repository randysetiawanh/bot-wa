const fs = require('fs');
const path = require('path');

/**
 * Menyimpan HTML ke dalam logs/debug/[subfolder]/YYYY-MM-DD.html
 * @param {string} name - Nama subfolder (misal: 'logammulia')
 * @param {string} html - Isi HTML dari page.content()
 */
function dumpHTML(name, html, isJual = false) {
  const rootDir = process.cwd();

  const iso = new Date().toISOString();
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 19).replace(/:/g, '');
  const fileName = `${name == 'logammulia' && isJual ? 'SELL-' : 'BB-'}${date} ${time}`;
  console.log(fileName)
  const dirPath = path.join(rootDir, 'logs', 'debug', name);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `${fileName}.html`);
  fs.writeFileSync(filePath, html, 'utf8');
}

module.exports = dumpHTML;
