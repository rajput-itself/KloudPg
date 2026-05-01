import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can access this endpoint' }, { status: 403 });
    }

    const { pgs, bookings, users } = await getCollections();
    const rows = await pgs.find({ owner_id: user.id }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    const pgIds = rows.map((pg) => pg.id);
    const bookingRows = pgIds.length
      ? await bookings.find({ pg_id: { $in: pgIds } }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray()
      : [];

    const userRows = await users.find(
      { id: { $in: [...new Set(bookingRows.map((booking) => booking.user_id))] } },
      { projection: { _id: 0, id: 1, name: 1, phone: 1, email: 1 } }
    ).toArray();
    const userById = new Map(userRows.map((row) => [row.id, row]));

    const pgsWithStats = rows.map((pg) => {
      const pgBookings = bookingRows.filter((booking) => booking.pg_id === pg.id);
      return {
        ...pg,
        total_bookings: pgBookings.length,
        pending_bookings: pgBookings.filter((booking) => booking.status === 'pending').length,
        confirmed_bookings: pgBookings.filter((booking) => booking.status === 'confirmed').length,
      };
    });

    const enrichedBookings = bookingRows.map((booking) => {
      const bookingUser = userById.get(booking.user_id);
      return {
        ...booking,
        user_name: bookingUser?.name || null,
        user_phone: bookingUser?.phone || null,
        user_email: bookingUser?.email || null,
      };
    });

    return NextResponse.json({ pgs: pgsWithStats, bookings: enrichedBookings });
  } catch (error) {
    console.error('Owner PGs error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
