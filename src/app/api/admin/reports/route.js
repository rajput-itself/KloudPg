import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

function isAdmin(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return null;
  return user;
}

function startDateForRange(range) {
  const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(request) {
  try {
    const user = isAdmin(request);
    if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { users, pgs, bookings, payments, complaints, reviews } = await getCollections();
    const url = new URL(request.url);
    const range = url.searchParams.get('range') || '30d';
    const startDate = startDateForRange(range);

    const [
      usersByRole,
      pgsByCity,
      bookingStatus,
      complaintStatus,
      revenue,
      reviewsSummary,
      recentBookings,
      topPgs,
    ] = await Promise.all([
      users.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $project: { _id: 0, label: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]).toArray(),
      pgs.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 }, approved: { $sum: '$is_approved' } } },
        { $project: { _id: 0, city: '$_id', count: 1, approved: 1 } },
        { $sort: { count: -1 } },
      ]).toArray(),
      bookings.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, label: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]).toArray(),
      complaints.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, label: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]).toArray(),
      payments.aggregate([
        { $match: { status: 'completed', created_at: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).next(),
      reviews.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
      ]).next(),
      bookings.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1 } },
      ]).toArray(),
      bookings.aggregate([
        { $group: { _id: '$pg_id', booking_count: { $sum: 1 } } },
        { $sort: { booking_count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'pgs', localField: '_id', foreignField: 'id', as: 'pg' } },
        { $unwind: '$pg' },
        { $project: { _id: 0, pg_id: '$_id', name: '$pg.name', city: '$pg.city', booking_count: 1 } },
      ]).toArray(),
    ]);

    return NextResponse.json({
      range,
      generatedAt: new Date().toISOString(),
      summary: {
        revenue: revenue?.total || 0,
        payments: revenue?.count || 0,
        reviews: reviewsSummary?.count || 0,
        avgRating: Math.round((reviewsSummary?.avg || 0) * 10) / 10,
      },
      usersByRole,
      pgsByCity,
      bookingStatus,
      complaintStatus,
      recentBookings,
      topPgs,
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
