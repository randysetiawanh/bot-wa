const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { scheduleJob } = require('node-schedule');
global.crypto = require('crypto');

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
          console.log(`❌ Grup "${groupNameTarget}" tidak ditemukan. Pastikan kamu adalah anggotanya.`);
          return;
        }

        const groupJid = group.id;
        console.log('🎯 Kirim pesan ke grup:', group.subject);

        scheduleJob('0 8 * * 1-5', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN MASUK JANGAN LUPA!' });
          console.log('📤 Reminder pagi dikirim');
        });

        scheduleJob('30 8 * * 1-5', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN MASUK JANGAN LUPA WOI!' });
          console.log('📤 Reminder pagi dikirim');
        });

        scheduleJob('0 17 * * 1-5', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN PULANG JUGA JANGAN LUPA!' });
        });

        scheduleJob('30 18 * * 1-5', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN PULANG JUGA JANGAN LUPA!!!' });
        });

        scheduleJob('55 18 * * 1-5', () => {
          sock.sendMessage(groupJid, { text: 'INI TEST!!!' });
        });

        console.log('⏰ Reminder aktif setiap hari pukul 08:00 & 17:00');
      } catch (err) {
        console.error('❌ Gagal ambil grup:', err);
      }
    }
  });
}

startBot();
