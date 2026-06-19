export function nightsBetween(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
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
