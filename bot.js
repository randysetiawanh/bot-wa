const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { scheduleJob } = require('node-schedule');

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

        // Kirim jam 08:00
        scheduleJob('30 8 * * *', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN MASUK JANGAN LUPA!' });
          console.log('📤 Reminder pagi dikirim');
        });

        // Kirim jam 17:00
        scheduleJob('0 17 * * *', () => {
          sock.sendMessage(groupJid, { text: '🔔🔔🔔 ABSEN PULANG JUGA JANGAN LUPA!' });
          console.log('📤 Reminder sore dikirim');
        });

        scheduleJob('36 20 * * *', () => {
          sock.sendMessage(groupJid, { text: '🔔 Ini pesan uji coba lagi bang' });
          console.log('📤 Pesan uji coba terkirim pada 20:32');
        });

        console.log('⏰ Reminder aktif setiap hari pukul 08:00 & 17:00');
      } catch (err) {
        console.error('❌ Gagal ambil grup:', err);
      }
    }
  });
}

startBot();
