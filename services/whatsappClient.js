const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('baileys');
const qrcode = require('qrcode-terminal');
const logger = require('../utils/logger');

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const sock = makeWASocket({
    auth: state,
    browser: [
      process.env.DEVICE_TYPE,
      process.env.DEVICE_BROWSER,
      process.env.DEVICE_VERSION
    ],
    // printQRInTerminal: true,a
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise((resolve, reject) => {
    sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
      if (qr) {
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        logger.info('✅ WhatsApp connected');

        // 🔁 Delay agar internal reinit selesai
        await new Promise(r => setTimeout(r, 3000));
        resolve(sock);
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;
        logger.warn('❌ Connection closed. Reconnect?', shouldReconnect);

        if (!shouldReconnect) {
          reject(new Error('Connection closed permanently.'));
        }
      }
    });
  });
}

module.exports = { connectWhatsApp };
