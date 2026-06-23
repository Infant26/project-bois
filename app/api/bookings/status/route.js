import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getBookingReference } from '@/lib/bookingReference';

export async function PATCH(request) {
  try {
    const payload = await request.json();
    const { id, booking_status } = payload;
    if (!id || !booking_status) {
      return NextResponse.json({ error: 'id and booking_status are required' }, { status: 400 });
    }
    if (!['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'].includes(booking_status)) {
      return NextResponse.json({ error: 'Invalid booking_status' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: currentBooking, error: currentError } = await supabase
      .from('bookings')
      .select('*, rooms(name)')
      .eq('id', id)
      .single();

    if (currentError || !currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ booking_status })
      .eq('id', id)
      .select('*, rooms(name)')
      .single();

    if (error) throw error;

    const updatedBooking = {
      ...data,
      room_name: data.rooms?.name,
      booking_reference: getBookingReference(data)
    };

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to update booking status' }, { status: 500 });
  }
}
