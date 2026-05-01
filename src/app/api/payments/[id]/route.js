import { NextResponse } from 'next/server';
import { getCollections, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { id } = await params;
    const paymentId = toInt(id);
    const { payments, bookings, pgs } = await getCollections();
    const payment = await payments.findOne({ id: paymentId }, { projection: { _id: 0 } });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    if (payment.user_id !== user.id && user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const booking = await bookings.findOne({ id: payment.booking_id }, { projection: { _id: 0 } });
    const pg = await pgs.findOne({ id: payment.pg_id }, { projection: { _id: 0 } });

    return NextResponse.json({
      payment: {
        ...payment,
        visit_date: booking?.visit_date || null,
        room_type: booking?.room_type || null,
        booking_status: booking?.status || null,
        pg_name: pg?.name || null,
        city: pg?.city || null,
        locality: pg?.locality || null,
      },
    });
  } catch (error) {
    console.error('Payment GET [id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
