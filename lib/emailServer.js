function getEmailJsConfig() {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey || serviceId.includes('your_')) {
    return null;
  }

  return { serviceId, templateId, publicKey };
}

function buildTemplateParams(booking, overrides = {}) {
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || '';

  return {
    property_name: process.env.NEXT_PUBLIC_PROPERTY_NAME,
    owner_email: ownerEmail,
    to_email: ownerEmail,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    guest_phone: booking.guest_phone,
    room_name: booking.room_name || booking.rooms?.name,
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    guest_count: booking.guest_count,
    total_amount: booking.total_amount,
    payment_status: booking.payment_status,
    booking_status: booking.booking_status,
    booking_id: booking.id,
    from_name: process.env.NEXT_PUBLIC_PROPERTY_NAME,
    from_email: ownerEmail,
    reply_to: booking.guest_email,
    ...overrides
  };
}

async function sendEmailJsTemplate(templateParams) {
  const config = getEmailJsConfig();
  if (!config) {
    console.warn('EmailJS is not configured. Skipping email.');
    return;
  }

  const body = {
    service_id: config.serviceId,
    template_id: config.templateId,
    user_id: config.publicKey,
    template_params: templateParams
  };

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS send failed: ${response.status} ${errorText}`);
  }
}

export async function sendOwnerBookingRequestEmail(booking) {
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL;
  if (!ownerEmail) return;

  const params = buildTemplateParams(booking, {
    to_email: ownerEmail,
    owner_email: ownerEmail,
    email_type: 'owner_booking_request',
    status_label: 'Pending Approval',
    booking_status: booking.booking_status || 'pending'
  });

  await sendEmailJsTemplate(params);
}

export async function sendGuestBookingConfirmedEmail(booking) {
  if (!booking?.guest_email) return;

  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || '';
  const params = buildTemplateParams(booking, {
    to_email: booking.guest_email,
    email_type: 'guest_booking_confirmed',
    status_label: 'Confirmed',
    booking_status: 'confirmed',
    reply_to: ownerEmail || booking.guest_email
  });

  await sendEmailJsTemplate(params);
}