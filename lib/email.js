import emailjs from '@emailjs/browser';

export async function sendBookingEmails(booking) {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey || serviceId.includes('your_')) {
    console.warn('EmailJS is not configured. Skipping email.');
    return;
  }

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  const templateParams = {
    property_name: process.env.NEXT_PUBLIC_PROPERTY_NAME,
    owner_email: ownerEmail,
    to_email: ownerEmail,
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
    booking_id: booking.id,
    from_name: process.env.NEXT_PUBLIC_PROPERTY_NAME,
    from_email: ownerEmail,
    reply_to: booking.guest_email
  };

  console.log('EmailJS templateParams:', templateParams);

  return emailjs.send(
    serviceId,
    templateId,
    templateParams,
    { publicKey }
  );
}
