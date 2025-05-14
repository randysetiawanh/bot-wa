const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { scheduleJob } = require('node-schedule');
const logger = require('./logger');

global.crypto = require('crypto');

process.on('uncaughtException', (err) => {
  logger.error(`❌ Uncaught Exception: ${err.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`❌ Unhandled Rejection: ${reason}`);
});

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({
    auth: state,
    browser: ['Ubuntu', 'Chrome', '22.04.4']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Tampilkan QR code jika ada
    if (qr) {
      console.log('\nScan QR berikut untuk login:');
      qrcode.generate(qr, { small: true });
    }

    // Jika koneksi putus
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Disconnected. Reconnecting?', shouldReconnect);
      if (shouldReconnect) startBot();
    }

    // Jika koneksi berhasil
    if (connection === 'open') {
      console.log('✅ Bot connected ke WhatsApp');

      try {
        const groups = await sock.groupFetchAllParticipating();
        const groupNameTarget = "KANTOR"; // Ubah sesuai nama grup kamu
        const group = Object.values(groups).find((g) => g.subject === groupNameTarget);

        if (!group) {
          const msg = `❌ Grup "${groupNameTarget}" tidak ditemukan. Pastikan kamu adalah anggotanya.`;
          console.log(msg);
          logger.warn(msg);
          return;
        }

        const groupJid = group.id;
        console.log('🎯 Kirim pesan ke grup:', group.subject);

        scheduleJob('0 8 * * *', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN MASUK JANGAN LUPA!' });
        });

        scheduleJob('30 8 * * *', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN MASUK JANGAN LUPA WOI!' });
        });

        scheduleJob('0 17 * * *', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN PULANG JUGA JANGAN LUPA!' });
        });

        scheduleJob('30 18 * * *', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN PULANG JUGA JANGAN LUPA!!!' });
        });

        scheduleJob('57 21 * * *', () => {
          sock.sendMessage(groupJid, { text: 'INI TEST!!!' });
        });
      } catch (err) {
        console.error('❌ Gagal ambil grup:', err);
      }
    }
  });
}

startBot();
