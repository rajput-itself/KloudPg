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
    const { pgs, users, bookings, reviews } = await getCollections();
    const url = new URL(request.url);
    const approved = url.searchParams.get('approved');
    const filter = {};
    if (approved === '0') filter.is_approved = 0;
    if (approved === '1') filter.is_approved = 1;

    const rows = await pgs.find(filter, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    const owners = await users.find(
      { id: { $in: [...new Set(rows.map((pg) => pg.owner_id))] } },
      { projection: { _id: 0, id: 1, name: 1, email: 1 } }
    ).toArray();
    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
    const enriched = await Promise.all(rows.map(async (pg) => ({
      ...pg,
      owner_name: ownerById.get(pg.owner_id)?.name || null,
      owner_email: ownerById.get(pg.owner_id)?.email || null,
      booking_count: await bookings.countDocuments({ pg_id: pg.id }),
      review_count: await reviews.countDocuments({ pg_id: pg.id }),
    })));

    return NextResponse.json({ pgs: enriched });
  } catch (error) {
    console.error('Admin pgs GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
