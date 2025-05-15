// Contoh format time: '30 8 * * 1-5' (jam 08:30 Senin–Jumat)

function cronMatch(cronTime, now = new Date()) {
  const [min, hour, , , days] = cronTime.split(' ');
  const currentMin = now.getMinutes();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // Minggu = 0, Senin = 1, dst

  const validDay = days === '*' || days.split(',').some(d => {
    if (d.includes('-')) {
      const [start, end] = d.split('-').map(Number);
      return currentDay >= start && currentDay <= end;
    }
    return Number(d) === currentDay;
  });

  return (
    parseInt(min) === currentMin &&
    parseInt(hour) === currentHour &&
    validDay
  );
}

module.exports = { cronMatch };
