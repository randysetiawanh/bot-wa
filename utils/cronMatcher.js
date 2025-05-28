// Contoh format time: '30 8 * * 1-5' (jam 08:30 Senin–Jumat)

function matchPart(part, current, max = 59) {
  if (part === '*') return true;

  if (part.includes(',')) {
    return part.split(',').some(p => matchPart(p, current, max));
  }

  if (part.startsWith('*/')) {
    const step = parseInt(part.slice(2), 10);
    return current % step === 0;
  }

  if (part.includes('-')) {
    const [start, end] = part.split('-').map(Number);
    return current >= start && current <= end;
  }

  return parseInt(part, 10) === current;
}

function cronMatch(cronTime, now = new Date()) {
  const [min, hour, , , days] = cronTime.split(' ');
  const currentMin = now.getMinutes();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // Minggu = 0, Senin = 1, dst

  return (
    matchPart(min, currentMin, 59) &&
    matchPart(hour, currentHour, 23) &&
    matchPart(days, currentDay, 6)
  );
}

module.exports = { cronMatch };
