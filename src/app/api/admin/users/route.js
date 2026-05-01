import { NextResponse } from 'next/server';
import { escapeRegex, getCollections, toInt } from '@/lib/db';
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
    const { users, bookings, reviews } = await getCollections();
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const filter = {};
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }
    if (role) filter.role = role;

    const rows = await users.find(filter, {
      projection: { _id: 0, password_hash: 0 },
    }).sort({ created_at: -1 }).toArray();

    const enriched = await Promise.all(rows.map(async (row) => ({
      ...row,
      booking_count: await bookings.countDocuments({ user_id: row.id }),
      review_count: await reviews.countDocuments({ user_id: row.id }),
    })));

    const [total, students, owners, blocked] = await Promise.all([
      users.countDocuments(),
      users.countDocuments({ role: 'student' }),
      users.countDocuments({ role: 'owner' }),
      users.countDocuments({ is_blocked: 1 }),
    ]);

    return NextResponse.json({ users: enriched, stats: { total, students, owners, blocked } });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = isAdmin(request);
    if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    const { user_id, is_blocked } = await request.json();
    const { users } = await getCollections();
    await users.updateOne({ id: toInt(user_id) }, { $set: { is_blocked: is_blocked ? 1 : 0 } });
    return NextResponse.json({ message: `User ${is_blocked ? 'blocked' : 'unblocked'}` });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
