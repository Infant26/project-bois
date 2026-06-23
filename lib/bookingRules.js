export function nightsBetween(checkIn, checkOut) {
  const [startYear, startMonth, startDay] = String(checkIn).split('-').map(Number);
  const [endYear, endMonth, endDay] = String(checkOut).split('-').map(Number);

  if (!startYear || !startMonth || !startDay || !endYear || !endMonth || !endDay) {
    return 0;
  }

  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
  const days = (endUtc - startUtc) / (1000 * 60 * 60 * 24);

  return Math.max(0, days);
}

function parseYmdToUtc(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;

  return {
    year,
    month,
    day,
    timestamp: Date.UTC(year, month - 1, day)
  };
}

export function weekendNightsBetween(checkIn, checkOut) {
  const start = parseYmdToUtc(checkIn);
  const end = parseYmdToUtc(checkOut);
  if (!start || !end || end.timestamp <= start.timestamp) return 0;

  let weekendNights = 0;
  for (let timestamp = start.timestamp; timestamp < end.timestamp; timestamp += 24 * 60 * 60 * 1000) {
    const dayOfWeek = new Date(timestamp).getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendNights += 1;
    }
  }

  return weekendNights;
}

export function calculateBookingTotal(checkIn, checkOut, pricePerNight, weekendSurcharge = 1000) {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return 0;

  const baseNightlyRate = Number(pricePerNight);
  const surchargePerWeekendNight = Number(weekendSurcharge);
  const weekendNights = weekendNightsBetween(checkIn, checkOut);

  return nights * baseNightlyRate + weekendNights * surchargePerWeekendNight;
}

export function validateBookingPayload(payload) {
  const required = ['room_id', 'guest_name', 'guest_email', 'guest_phone', 'check_in_date', 'check_out_date', 'guest_count'];
  for (const key of required) {
    if (!payload?.[key]) return `${key} is required`;
  }
  if (nightsBetween(payload.check_in_date, payload.check_out_date) < 1) {
    return 'Check-out date must be after check-in date';
  }
  return null;
}
