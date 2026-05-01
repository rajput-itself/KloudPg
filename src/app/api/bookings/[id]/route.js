import { NextResponse } from 'next/server';
import { addNotification, getCollections, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

async function enrichBooking(booking, collections) {
  const { pgs, users, payments } = collections;
  const [pg, bookingUser, payment] = await Promise.all([
    pgs.findOne({ id: booking.pg_id }, { projection: { _id: 0 } }),
    users.findOne({ id: booking.user_id }, { projection: { _id: 0, name: 1, email: 1, phone: 1 } }),
    payments.findOne({ booking_id: booking.id }, { projection: { _id: 0 } }),
  ]);

  return {
    ...booking,
    pg_name: pg?.name || null,
    city: pg?.city || null,
    locality: pg?.locality || null,
    image_url: pg?.image_url || null,
    price_min: pg?.price_min || null,
    price_max: pg?.price_max || null,
    user_name: bookingUser?.name || null,
    user_email: bookingUser?.email || null,
    user_phone: bookingUser?.phone || null,
    payment_id: payment?.id || null,
    payment_status: payment?.status || null,
    payment_amount: payment?.amount || null,
  };
}

export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { id } = await params;
    const bookingId = toInt(id);
    const collections = await getCollections();
    const booking = await collections.bookings.findOne({ id: bookingId }, { projection: { _id: 0 } });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const pg = await collections.pgs.findOne({ id: booking.pg_id });
    if (user.role !== 'admin' && booking.user_id !== user.id && pg?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ booking: await enrichBooking(booking, collections) });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { id } = await params;
    const bookingId = toInt(id);
    const { status, refund_reason } = await request.json();
    const { bookings, pgs, payments } = await getCollections();
    const booking = await bookings.findOne({ id: bookingId });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const pg = await pgs.findOne({ id: booking.pg_id });
    const isOwner = pg?.owner_id === user.id;
    const isCustomer = booking.user_id === user.id;
    const isAdmin = user.role === 'admin';

    if (status === 'cancelled' && !isCustomer && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if ((status === 'confirmed' || status === 'rejected') && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Only the PG owner can confirm or reject bookings' }, { status: 403 });
    }

    await bookings.updateOne({ id: bookingId }, { $set: { status } });

    const titleMap = {
      cancelled: 'Booking Cancelled',
      confirmed: 'Booking Confirmed!',
      rejected: 'Booking Rejected',
    };
    const msgMap = {
      cancelled: `Booking #${bookingId} has been cancelled.`,
      confirmed: `Your booking request #${bookingId} has been confirmed by the owner!`,
      rejected: `Your booking request #${bookingId} was rejected by the owner.`,
    };
    if (titleMap[status]) {
      await addNotification(isCustomer ? pg?.owner_id : booking.user_id, titleMap[status], msgMap[status], 'booking', '/dashboard');
    }

    if (status === 'cancelled') {
      const payment = await payments.findOne({ booking_id: bookingId, status: 'completed' });
      if (payment) {
        await payments.updateOne(
          { id: payment.id },
          { $set: { status: 'refunded', refund_reason: refund_reason || 'Customer cancelled booking' } }
        );
        await addNotification(booking.user_id, 'Refund Initiated', `Refund of ₹${payment.amount} initiated for booking #${bookingId}.`, 'refund', '/dashboard');
      }
    }

    return NextResponse.json({ message: `Booking ${status} successfully` });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
