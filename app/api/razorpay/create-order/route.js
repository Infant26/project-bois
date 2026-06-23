import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { calculateBookingTotal, validateBookingPayload } from '@/lib/bookingRules';

export async function POST(request) {
  try {
    const payload = await request.json();
    const validationError = validateBookingPayload(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', payload.room_id)
      .eq('is_active', true)
      .single();

    if (error || !room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const totalAmount = calculateBookingTotal(payload.check_in_date, payload.check_out_date, room.price_per_night);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `room_${Date.now()}`,
      notes: {
        room_id: String(payload.room_id),
        guest_email: payload.guest_email
      }
    });

    return NextResponse.json({ order, amount: totalAmount, room });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to create Razorpay order' }, { status: 500 });
  }
}
