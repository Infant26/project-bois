import emailjs from '@emailjs/browser';

export async function sendBookingEmails(booking) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey || serviceId.includes('your_')) {
    console.warn('EmailJS is not configured. Skipping email.');
    return;
  }

  return emailjs.send(
    serviceId,
    templateId,
    {
      property_name: process.env.NEXT_PUBLIC_PROPERTY_NAME,
      owner_email: process.env.NEXT_PUBLIC_OWNER_EMAIL,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      guest_phone: booking.guest_phone,
      room_name: booking.room_name,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      guest_count: booking.guest_count,
      total_amount: booking.total_amount,
      payment_status: booking.payment_status,
      booking_status: booking.booking_status,
      booking_id: booking.id
    },
    { publicKey }
  );
}
