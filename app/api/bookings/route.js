import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { calculateBookingTotal, validateBookingPayload } from '@/lib/bookingRules';
import { sendOwnerBookingRequestEmail } from '@/lib/emailServer';
import { getBookingReference } from '@/lib/bookingReference';

export async function POST(request) {
  try {
    const payload = await request.json();
    const validationError = validateBookingPayload(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', payload.room_id)
      .eq('is_active', true)
      .single();

    if (roomError || !room) return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    if (Number(payload.guest_count) > Number(room.max_guests)) {
      return NextResponse.json({ error: `Maximum guests allowed for this room is ${room.max_guests}` }, { status: 400 });
    }

    const { data: overlaps, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('room_id', payload.room_id)
      .in('booking_status', ['pending', 'confirmed'])
      .lt('check_in_date', payload.check_out_date)
      .gt('check_out_date', payload.check_in_date);

    if (overlapError) throw overlapError;
    if (overlaps?.length) {
      return NextResponse.json({ error: 'Selected dates are already reserved for this room' }, { status: 409 });
    }

    const totalAmount = calculateBookingTotal(payload.check_in_date, payload.check_out_date, room.price_per_night);

    const bookingToInsert = {
      room_id: payload.room_id,
      guest_name: payload.guest_name.trim(),
      guest_email: payload.guest_email.trim().toLowerCase(),
      guest_phone: payload.guest_phone.trim(),
      check_in_date: payload.check_in_date,
      check_out_date: payload.check_out_date,
      guest_count: Number(payload.guest_count),
      special_requests: payload.special_requests || null,
      total_amount: totalAmount,
      payment_status: payload.payment_status || 'pay_at_property',
      booking_status: payload.booking_status || 'pending',
      razorpay_order_id: payload.razorpay_order_id || null,
      razorpay_payment_id: payload.razorpay_payment_id || null
    };

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert(bookingToInsert)
      .select('*, rooms(name)')
      .single();

    if (insertError) throw insertError;

    const bookingWithRoomName = {
      ...booking,
      room_name: booking.rooms?.name,
      booking_reference: getBookingReference(booking)
    };

    sendOwnerBookingRequestEmail(bookingWithRoomName).catch((emailError) => {
      console.warn('Owner booking request email failed:', emailError);
    });

    return NextResponse.json({
      booking: bookingWithRoomName
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to create booking' }, { status: 500 });
  }
}
