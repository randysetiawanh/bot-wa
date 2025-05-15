const { absenScheduleList } = require('../data/absenScheduleList');
const { cronMatch } = require('../utils/cronMatcher');
const { connectWhatsApp } = require('./whatsappClient');
const logger = require('../utils/logger');
const config = require('../config');

async function checkScheduleAndSend() {
  const now = new Date();
  const schedule = absenScheduleList.find(s => cronMatch(s.time, now));
  if (!schedule) return;

  logger.info(`⏰ Waktu cocok: "${schedule.message}" (${schedule.time})`);

  for (let attempt = 1; attempt <= config.retryLimit; attempt++) {
    try {
      const sock = await connectWhatsApp();
      const groups = await sock.groupFetchAllParticipating();
      const group = Object.values(groups).find(
        g => g.subject === process.env.GROUP_NAME
      );

      if (!group) {
        throw new Error(`Grup "${process.env.GROUP_NAME}" tidak ditemukan`);
      }

      await sock.sendMessage(group.id, { text: schedule.message });
      logger.info(`📤 Absen terkirim: "${schedule.message}"`);
      break; // sukses kirim, keluar dari loop
    } catch (err) {
      logger.warn(`🔁 Attempt ${attempt} gagal: ${err.message}`);
      if (attempt === config.retryLimit) {
        logger.error(`❌ Gagal kirim absen setelah ${attempt} percobaan. Skip.`);
      } else {
        await new Promise(res => setTimeout(res, 60 * 1000)); // tunggu 1 menit
      }
    }
  }
}

module.exports = function startAbsenScheduler() {
  logger.info('📡 Memulai scheduler absen...');

  // Langsung cek pertama kali saat program dijalankan
  checkScheduleAndSend();

  // Lanjut jalan setiap 1 menit
  setInterval(checkScheduleAndSend, config.absenInterval);
};
