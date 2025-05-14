const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');

let sock;

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  sock = makeWASocket({ auth: state, browser: ['Ubuntu', 'Chrome', '22.04'] });

  sock.ev.on('creds.update', saveCreds);

  return new Promise((resolve, reject) => {
    sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
      if (qr) qrcode.generate(qr, { small: true });

      if (connection === 'open') {
        logger.info('✅ WhatsApp connected');
        resolve(sock);
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.warn(`❌ WhatsApp disconnected. Reconnect? ${shouldReconnect}`);
        reject(new Error('WhatsApp disconnected'));
      }
    });
  });
}

module.exports = { connectWhatsApp };
