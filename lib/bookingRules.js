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
