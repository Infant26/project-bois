import emailjs from '@emailjs/browser';

const PROPERTY_NAME = 'The Coastal Calm';

function getEmailJsConfig() {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey || serviceId.includes('your_')) {
    console.warn('EmailJS is not configured. Skipping email.');
    return null;
  }

  return { serviceId, templateId, publicKey };
}

function buildTemplateParams(booking, overrides = {}) {
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;

  return {
    property_name: PROPERTY_NAME,
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
    from_name: PROPERTY_NAME,
    from_email: ownerEmail,
    reply_to: booking.guest_email,
    ...overrides
  };
}

async function sendTemplate(templateParams) {
  const config = getEmailJsConfig();
  if (!config) return;

  console.log('EmailJS templateParams:', templateParams);

  return emailjs.send(
    config.serviceId,
    config.templateId,
    templateParams,
    { publicKey: config.publicKey }
  );
}

export async function sendOwnerBookingRequestEmailClient(booking) {
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;

  return sendTemplate(buildTemplateParams(booking, {
    to_email: ownerEmail,
    owner_email: ownerEmail,
    guest_email: ownerEmail,
    guest_contact_email: booking.guest_email,
    actual_guest_email: booking.guest_email,
    email_type: 'owner_booking_request',
    status_label: 'Pending Approval',
    booking_status: booking.booking_status || 'pending',
    reply_to: booking.guest_email
  }));
}

export async function sendGuestBookingConfirmedEmailClient(booking) {
  return sendTemplate(buildTemplateParams(booking, {
    to_email: booking.guest_email,
    email_type: 'guest_booking_confirmed',
    status_label: 'Confirmed',
    booking_status: 'confirmed',
    reply_to: process.env.NEXT_PUBLIC_OWNER_EMAIL || booking.guest_email
  }));
}
