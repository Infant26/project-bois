export function generateBookingReference(value) {
  const raw = typeof value === 'string' ? value : value?.id || '';
  if (!raw) return '00000';

  // Deterministic 5-digit reference derived from booking UUID.
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 31 + raw.charCodeAt(index)) % 90000;
  }

  return String(hash + 10000).padStart(5, '0');
}

export function getBookingReference(booking) {
  if (booking?.booking_reference) {
    const normalized = String(booking.booking_reference).replace(/\D/g, '');
    if (normalized.length >= 5) return normalized.slice(-5);
    if (normalized.length > 0) return normalized.padStart(5, '0');
  }

  return generateBookingReference(booking);
}