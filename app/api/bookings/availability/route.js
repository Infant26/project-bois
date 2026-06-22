import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const roomId = request.nextUrl.searchParams.get('room_id');
    if (!roomId) {
      return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('bookings')
      .select('check_in_date, check_out_date')
      .eq('room_id', roomId)
      .in('booking_status', ['pending', 'confirmed'])
      .order('check_in_date', { ascending: true });

    if (error) {
      throw error;
    }

    const blockedRanges = (data || []).map((booking) => ({
      start: booking.check_in_date,
      end: booking.check_out_date
    }));

    return NextResponse.json({ blockedRanges });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to load blocked dates' }, { status: 500 });
  }
}
