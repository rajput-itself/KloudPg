import { NextResponse } from 'next/server';
import { addNotification, getCollections, insertDoc, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { booking_id, amount, payment_method } = await request.json();
    const bookingId = toInt(booking_id);
    if (!bookingId || !amount) return NextResponse.json({ error: 'booking_id and amount are required' }, { status: 400 });

    const { bookings, payments, pgs } = await getCollections();
    const booking = await bookings.findOne({ id: bookingId, user_id: user.id });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const existing = await payments.findOne({ booking_id: bookingId, status: 'completed' });
    if (existing) return NextResponse.json({ error: 'This booking is already paid' }, { status: 409 });

    const transaction_id = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const payment = await insertDoc(payments, 'payments', {
      booking_id: bookingId,
      user_id: user.id,
      pg_id: booking.pg_id,
      amount: Number(amount),
      status: 'completed',
      transaction_id,
      payment_method: payment_method || 'card',
    });

    await bookings.updateOne({ id: bookingId }, { $set: { status: 'confirmed' } });
    await addNotification(user.id, 'Payment Successful', `Payment of ₹${amount} received. Booking #${bookingId} is confirmed!`, 'payment', '/dashboard');

    const pg = await pgs.findOne({ id: booking.pg_id });
    if (pg) {
      await addNotification(pg.owner_id, 'New Payment Received', `${user.name} paid ₹${amount} for booking #${bookingId} at "${pg.name}".`, 'payment', '/owner/dashboard');
    }

    return NextResponse.json({ id: payment.id, transaction_id, status: 'completed', message: 'Payment successful' }, { status: 201 });
  } catch (error) {
    console.error('Payment POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { payments, bookings, pgs } = await getCollections();
    const rows = await payments.find({ user_id: user.id }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    const bookingRows = await bookings.find({ id: { $in: [...new Set(rows.map((payment) => payment.booking_id))] } }, { projection: { _id: 0 } }).toArray();
    const pgRows = await pgs.find({ id: { $in: [...new Set(rows.map((payment) => payment.pg_id))] } }, { projection: { _id: 0 } }).toArray();
    const bookingById = new Map(bookingRows.map((booking) => [booking.id, booking]));
    const pgById = new Map(pgRows.map((pg) => [pg.id, pg]));

    return NextResponse.json({
      payments: rows.map((payment) => {
        const booking = bookingById.get(payment.booking_id);
        const pg = pgById.get(payment.pg_id);
        return {
          ...payment,
          visit_date: booking?.visit_date || null,
          room_type: booking?.room_type || null,
          pg_name: pg?.name || null,
          city: pg?.city || null,
          locality: pg?.locality || null,
        };
      }),
    });
  } catch (error) {
    console.error('Payment GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
