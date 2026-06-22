'use client';

import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { supabase } from '@/lib/supabaseClient';
import { nightsBetween } from '@/lib/bookingRules';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function areRangesOverlapping(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function parseDateString(value) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function BookingForm() {
  const [rooms, setRooms] = useState([]);
  const [blockedRanges, setBlockedRanges] = useState([]);
  const [form, setForm] = useState({
    room_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    guest_count: 1,
    special_requests: ''
  });
  const [message, setMessage] = useState('');
  const [dateError, setDateError] = useState('');
  const [loading, setLoading] = useState(false);

  const enableRazorpay = process.env.NEXT_PUBLIC_ENABLE_RAZORPAY === 'true';
  const selectedRoom = rooms.find((room) => String(room.id) === String(form.room_id));
  const nights = form.check_in_date && form.check_out_date ? nightsBetween(form.check_in_date, form.check_out_date) : 0;
  const total = selectedRoom && nights > 0 ? nights * Number(selectedRoom.price_per_night) : 0;
  const selectedDateRange = {
    from: parseDateString(form.check_in_date),
    to: form.check_out_date ? addDays(parseDateString(form.check_out_date), -1) : undefined
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledDateMatchers = [
    { before: today },
    ...blockedRanges
      .map((range) => {
        const from = parseDateString(range.start);
        const endDate = parseDateString(range.end);
        if (!from || !endDate) return null;
        const to = addDays(endDate, -1);
        if (!from || !to || to < from) return null;
        return { from, to };
      })
      .filter(Boolean)
  ];

  useEffect(() => {
    async function loadRooms() {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('price_per_night');
      if (error) setMessage(error.message);
      else setRooms(data || []);
    }
    loadRooms();
  }, []);

  useEffect(() => {
    if (!form.room_id) {
      setBlockedRanges([]);
      return;
    }

    async function loadBlockedDates() {
      setMessage('');
      try {
        const response = await fetch(`/api/bookings/availability?room_id=${form.room_id}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load availability');
        setBlockedRanges(result.blockedRanges || []);
      } catch (error) {
        setMessage(error.message);
      }
    }

    loadBlockedDates();
  }, [form.room_id]);

  useEffect(() => {
    if (!form.check_in_date || !form.check_out_date) {
      setDateError('');
      return;
    }

    if (form.check_in_date >= form.check_out_date) {
      setDateError('Check-out must be after check-in.');
      return;
    }

    const rangeBlocked = blockedRanges.some((range) =>
      areRangesOverlapping(range.start, range.end, form.check_in_date, form.check_out_date)
    );

    if (rangeBlocked) {
      setDateError('Selected dates overlap with an existing booking. Please choose different dates.');
    } else {
      setDateError('');
    }
  }, [form.check_in_date, form.check_out_date, blockedRanges]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateDateRange(range) {
    if (!range?.from) {
      setForm((current) => ({
        ...current,
        check_in_date: '',
        check_out_date: ''
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      check_in_date: formatDateString(range.from),
      check_out_date: range.to ? formatDateString(addDays(range.to, 1)) : ''
    }));
  }

  async function saveBooking(extra = {}) {
    if (dateError) throw new Error(dateError);
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        ...extra
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Booking failed');

    return result.booking;
  }

  async function submitPayAtProperty(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const booking = await saveBooking({
        payment_status: 'pay_at_property',
        booking_status: 'pending'
      });
      setMessage(`Booking request sent. Reference: ${booking.id}. You will receive confirmation after approval.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitWithRazorpay(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Unable to load Razorpay checkout');

      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const orderResult = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderResult.error || 'Unable to create payment order');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        name: process.env.NEXT_PUBLIC_PROPERTY_NAME,
        description: selectedRoom?.name || 'Room Booking',
        order_id: orderResult.order.id,
        prefill: {
          name: form.guest_name,
          email: form.guest_email,
          contact: form.guest_phone
        },
        handler: async function (response) {
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response)
          });
          const verifyResult = await verifyResponse.json();
          if (!verifyResponse.ok || !verifyResult.verified) throw new Error('Payment verification failed');

          const booking = await saveBooking({
            payment_status: 'paid',
            booking_status: 'pending',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id
          });
          setMessage(`Payment received. Booking request submitted. Reference: ${booking.id}`);
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setMessage('Payment was cancelled. Booking was not saved.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <form className="booking-card" onSubmit={enableRazorpay ? submitWithRazorpay : submitPayAtProperty}>
      <h2>Reserve your stay</h2>
      <label>Room
        <select name="room_id" value={form.room_id} onChange={updateField} required>
          <option value="">Select room</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>{room.name} - ₹{room.price_per_night}/night</option>
          ))}
        </select>
      </label>
      <div className="grid-two">
        <label className="calendar-label">Select stay dates
          <DayPicker
            mode="range"
            numberOfMonths={2}
            selected={selectedDateRange}
            onSelect={updateDateRange}
            disabled={disabledDateMatchers}
            modifiersClassNames={{
              disabled: 'rdp-day-blocked'
            }}
            required
          />
        </label>
      </div>
      <input type="hidden" name="check_in_date" value={form.check_in_date} required readOnly />
      <input type="hidden" name="check_out_date" value={form.check_out_date} required readOnly />
      <div className="grid-two">
        <label>Guest name
          <input name="guest_name" value={form.guest_name} onChange={updateField} required />
        </label>
        <label>Guest count
          <input type="number" min="1" name="guest_count" value={form.guest_count} onChange={updateField} required />
        </label>
      </div>
      <div className="grid-two">
        <label>Email
          <input type="email" name="guest_email" value={form.guest_email} onChange={updateField} required />
        </label>
        <label>Phone
          <input name="guest_phone" value={form.guest_phone} onChange={updateField} required />
        </label>
      </div>
      <label>Special requests
        <textarea name="special_requests" value={form.special_requests} onChange={updateField} rows="3" />
      </label>
      <div className="price-box">
        <span>{nights || 0} night(s)</span>
        <strong>₹{total || 0}</strong>
      </div>
      <button disabled={loading || !form.room_id || !!dateError}>
        {loading ? 'Processing...' : enableRazorpay ? 'Pay & Reserve' : 'Reserve Now'}
      </button>
      {(message || dateError) && <p className="message">{dateError || message}</p>}
    </form>
  );
}
