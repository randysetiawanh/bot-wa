const { connectWhatsApp } = require('./whatsappClient');
const logger = require('../utils/logger');

module.exports = async function waSendMessage(message, label = 'Pesan') {
  const sock = await connectWhatsApp(); // sekarang benar-benar sudah siap
  const groups = await sock.groupFetchAllParticipating();
  const group = Object.values(groups).find(
    g => g.subject === process.env.GROUP_NAME
  );

  if (!group) {
    throw new Error(`Grup "${process.env.GROUP_NAME}" tidak ditemukan`);
  }

  await sock.sendMessage(group.id, { text: message });
  logger.info(`📤 ${label} terkirim!`);
};
