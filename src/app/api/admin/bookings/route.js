import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

function isAdmin(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function GET(request) {
  try {
    const user = isAdmin(request);
    if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    const { bookings, users, pgs } = await getCollections();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const filter = status ? { status } : {};

    const rows = await bookings.find(filter, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    const userRows = await users.find(
      { id: { $in: [...new Set(rows.map((booking) => booking.user_id))] } },
      { projection: { _id: 0, id: 1, name: 1, email: 1 } }
    ).toArray();
    const pgRows = await pgs.find(
      { id: { $in: [...new Set(rows.map((booking) => booking.pg_id))] } },
      { projection: { _id: 0, id: 1, name: 1, city: 1, locality: 1, owner_id: 1 } }
    ).toArray();
    const ownerRows = await users.find(
      { id: { $in: [...new Set(pgRows.map((pg) => pg.owner_id))] } },
      { projection: { _id: 0, id: 1, name: 1 } }
    ).toArray();
    const userById = new Map(userRows.map((row) => [row.id, row]));
    const pgById = new Map(pgRows.map((row) => [row.id, row]));
    const ownerById = new Map(ownerRows.map((row) => [row.id, row]));

    const [total, pending, confirmed, cancelled] = await Promise.all([
      bookings.countDocuments(),
      bookings.countDocuments({ status: 'pending' }),
      bookings.countDocuments({ status: 'confirmed' }),
      bookings.countDocuments({ status: 'cancelled' }),
    ]);

    return NextResponse.json({
      bookings: rows.map((booking) => {
        const pg = pgById.get(booking.pg_id);
        const bookingUser = userById.get(booking.user_id);
        return {
          ...booking,
          user_name: bookingUser?.name || null,
          user_email: bookingUser?.email || null,
          pg_name: pg?.name || null,
          city: pg?.city || null,
          locality: pg?.locality || null,
          owner_name: ownerById.get(pg?.owner_id)?.name || null,
        };
      }),
      stats: { total, pending, confirmed, cancelled },
    });
  } catch (error) {
    console.error('Admin bookings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
