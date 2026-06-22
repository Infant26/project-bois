# Single Property Room Booking Website

This is a complete starter project for a private property booking website: room selection, date reservation, Supabase database, optional Razorpay payment, EmailJS confirmation, and admin booking dashboard.

## Tech Stack

- Next.js / React
- Supabase database and admin auth
- EmailJS confirmation emails
- Razorpay Standard Checkout, optional

Razorpay recommends creating an order server-side, passing the order ID to Checkout, then verifying the signature after payment success. This starter follows that pattern. Supabase is used with React through `@supabase/supabase-js`, and EmailJS uses `@emailjs/browser`.

## 1. Install

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/admin
```

## 2. Supabase Setup

1. Create a Supabase project.
2. Go to SQL Editor.
3. Run `supabase/schema.sql`.
4. Go to Project Settings > API.
5. Copy Project URL, anon key, and service role key into `.env.local`.
6. Go to Authentication > Users and create your admin user manually.

## 3. EmailJS Setup

Create one EmailJS template with these variables:

```text
property_name
owner_email
guest_name
guest_email
guest_phone
room_name
check_in_date
check_out_date
guest_count
total_amount
payment_status
booking_status
booking_id
```

Suggested template subject:

```text
Booking Confirmation - {{property_name}} - {{booking_id}}
```

Suggested body:

```text
Hello {{guest_name}},

Your booking at {{property_name}} is confirmed.

Room: {{room_name}}
Check-in: {{check_in_date}}
Check-out: {{check_out_date}}
Guests: {{guest_count}}
Total Amount: ₹{{total_amount}}
Payment Status: {{payment_status}}
Booking Reference: {{booking_id}}

Please pay at the property if payment status is pay_at_property.

Thank you.
```

To notify both guest and owner, configure EmailJS template recipients as:

```text
To: {{guest_email}}
CC or BCC: {{owner_email}}
```

## 4. Razorpay Setup Optional

Default mode is Pay at Property:

```text
NEXT_PUBLIC_ENABLE_RAZORPAY=false
```

To enable online payment:

```text
NEXT_PUBLIC_ENABLE_RAZORPAY=true
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Test with Razorpay test mode first. Do not use live keys until the test payment flow works fully.

## 5. What You Must Modify

Update these in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_PROPERTY_NAME
NEXT_PUBLIC_PROPERTY_LOCATION
NEXT_PUBLIC_OWNER_EMAIL
NEXT_PUBLIC_EMAILJS_SERVICE_ID
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
```

Update room data in Supabase table `rooms`:

```text
name
description
price_per_night
max_guests
image_url
is_active
```

Replace hero image:

```text
public/property-hero.jpg
```

If you do not add this image, the site still runs, but the hero background image will be missing.

## 6. Production Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Never expose `RAZORPAY_KEY_SECRET` in browser code.
- Use Supabase Auth for admin login.
- Booking overlap is checked before saving.
- Payment bookings are saved only after Razorpay success and signature verification.
- Pay-at-property bookings are saved immediately as confirmed.

## 7. Important Files

```text
app/page.jsx                         Main booking page
components/BookingForm.jsx           Booking form and payment flow
app/admin/page.jsx                    Admin booking dashboard
app/api/bookings/route.js             Booking creation API
app/api/razorpay/create-order/route.js Razorpay order API
app/api/razorpay/verify-payment/route.js Razorpay signature verification
supabase/schema.sql                   Database schema and policies
.env.example                          Values you must replace
```
