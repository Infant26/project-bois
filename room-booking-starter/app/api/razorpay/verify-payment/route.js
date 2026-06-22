import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ verified: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ verified: false, error: 'Payment verification failed' }, { status: 500 });
  }
}
