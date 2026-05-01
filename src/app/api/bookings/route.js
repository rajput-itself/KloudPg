import { NextResponse } from 'next/server';
import { getCollections, insertDoc, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

function bookingWithPg(booking, pg) {
  return {
    ...booking,
    pg_name: pg?.name || null,
    city: pg?.city || null,
    locality: pg?.locality || null,
    image_url: pg?.image_url || null,
    price_min: pg?.price_min || null,
    price_max: pg?.price_max || null,
  };
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { bookings, pgs } = await getCollections();
    const rows = await bookings.find({ user_id: user.id }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    const pgRows = await pgs.find(
      { id: { $in: [...new Set(rows.map((booking) => booking.pg_id))] } },
      { projection: { _id: 0 } }
    ).toArray();
    const pgById = new Map(pgRows.map((pg) => [pg.id, pg]));

    return NextResponse.json({ bookings: rows.map((booking) => bookingWithPg(booking, pgById.get(booking.pg_id))) });
  } catch (error) {
    console.error('Bookings list error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { pg_id, room_type, visit_date, message, phone } = await request.json();
    const pgId = toInt(pg_id);
    if (!pgId) return NextResponse.json({ error: 'PG ID is required' }, { status: 400 });

    const { bookings, pgs } = await getCollections();
    const pg = await pgs.findOne({ id: pgId });
    if (!pg) return NextResponse.json({ error: 'PG not found' }, { status: 404 });

    const booking = await insertDoc(bookings, 'bookings', {
      user_id: user.id,
      pg_id: pgId,
      room_type: room_type || null,
      status: 'pending',
      visit_date: visit_date || null,
      message: message || null,
      phone: phone || null,
    });

    return NextResponse.json({ id: booking.id, message: 'Booking request submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
