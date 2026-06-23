'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sendGuestBookingConfirmedEmailClient } from '@/lib/email';
import { getBookingReference } from '@/lib/bookingReference';

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadBookings();
  }, [session]);

  async function signIn(event) {
    event.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, rooms(name)')
      .order('created_at', { ascending: false });
    if (error) setMessage(error.message);
    else setBookings(data || []);
  }

  async function updateBookingStatus(id, status) {
    setMessage('');
    try {
      const response = await fetch('/api/bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, booking_status: status })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update booking status');

      if (status === 'confirmed' && result.booking) {
        await sendGuestBookingConfirmedEmailClient(result.booking);
      }

      await loadBookings();
      setMessage(result.warning || `Booking ${status} successfully.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <main className="admin-wrap">
        <form className="booking-card small" onSubmit={signIn}>
          <h2>Admin login</h2>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          <button>Login</button>
          {message && <p className="message">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-wrap">
      <div className="admin-header">
        <h1>Bookings</h1>
        <button onClick={signOut}>Logout</button>
      </div>
      {message && <p className="message">{message}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ref</th><th>Room</th><th>Guest</th><th>Dates</th><th>Guests</th><th>Amount</th><th>Status</th><th>Payment</th><th>Contact</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{getBookingReference(booking)}</td>
                <td>{booking.rooms?.name}</td>
                <td>{booking.guest_name}</td>
                <td>{booking.check_in_date} → {booking.check_out_date}</td>
                <td>{booking.guest_count}</td>
                <td>₹{booking.total_amount}</td>
                <td>{booking.booking_status}</td>
                <td>{booking.payment_status}</td>
                <td>{booking.guest_email}<br />{booking.guest_phone}</td>
                <td>
                  {booking.booking_status === 'pending' ? (
                    <div className="admin-actions">
                      <button type="button" onClick={() => updateBookingStatus(booking.id, 'confirmed')}>Approve</button>
                      <button type="button" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>Reject</button>
                    </div>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
