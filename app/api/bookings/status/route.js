import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

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
    const { data, error } = await supabase
      .from('bookings')
      .update({ booking_status })
      .eq('id', id)
      .select('id');

    if (error) throw error;

    return NextResponse.json({ success: true, booking: data?.[0] || null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to update booking status' }, { status: 500 });
  }
}
