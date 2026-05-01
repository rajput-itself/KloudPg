import { NextResponse } from 'next/server';
import { addNotification, getCollections, insertDoc, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const { reviews, users, pgs } = await getCollections();
    const url = new URL(request.url);
    const pg_id = url.searchParams.get('pg_id');
    const user_id = url.searchParams.get('user_id');

    if (pg_id) {
      const rows = await reviews.find({ pg_id: toInt(pg_id) }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
      const reviewUsers = await users.find(
        { id: { $in: [...new Set(rows.map((r) => r.user_id))] } },
        { projection: { _id: 0, id: 1, name: 1, avatar_url: 1 } }
      ).toArray();
      const userById = new Map(reviewUsers.map((u) => [u.id, u]));
      return NextResponse.json({
        reviews: rows.map((review) => ({
          ...review,
          user_name: userById.get(review.user_id)?.name || null,
          avatar_url: userById.get(review.user_id)?.avatar_url || null,
        })),
      });
    }

    if (user_id) {
      const rows = await reviews.find({ user_id: toInt(user_id) }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
      const pgRows = await pgs.find(
        { id: { $in: [...new Set(rows.map((r) => r.pg_id))] } },
        { projection: { _id: 0, id: 1, name: 1, city: 1, locality: 1 } }
      ).toArray();
      const pgById = new Map(pgRows.map((pg) => [pg.id, pg]));
      return NextResponse.json({
        reviews: rows.map((review) => ({ ...review, ...(pgById.get(review.pg_id) || {}) })),
      });
    }

    return NextResponse.json({ reviews: [] });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { pg_id, rating, comment, booking_id } = await request.json();
    const pgId = toInt(pg_id);
    if (!pgId || !rating) return NextResponse.json({ error: 'pg_id and rating are required' }, { status: 400 });
    if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });

    const { pgs, reviews } = await getCollections();
    const pg = await pgs.findOne({ id: pgId });
    if (!pg) return NextResponse.json({ error: 'PG not found' }, { status: 404 });

    const existing = await reviews.findOne({ user_id: user.id, pg_id: pgId });
    if (existing) return NextResponse.json({ error: 'You have already reviewed this PG' }, { status: 409 });

    const review = await insertDoc(reviews, 'reviews', {
      user_id: user.id,
      pg_id: pgId,
      booking_id: booking_id ? toInt(booking_id) : null,
      rating: Number(rating),
      comment: comment || null,
    });

    const stats = await reviews.aggregate([
      { $match: { pg_id: pgId } },
      { $group: { _id: '$pg_id', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]).next();
    await pgs.updateOne({ id: pgId }, { $set: { rating: Math.round((stats?.avg || 0) * 10) / 10, total_reviews: stats?.count || 0 } });
    await addNotification(pg.owner_id, 'New Review Received', `${user.name} left a ${rating}-star review on your PG "${pg.name}".`, 'review', '/owner/dashboard');

    return NextResponse.json({ id: review.id, message: 'Review submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Review POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
