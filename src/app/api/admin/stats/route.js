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
    const { users, pgs, bookings, payments, reviews, complaints, messages } = await getCollections();

    const [
      userCount,
      pgCount,
      pgsApproved,
      pgsPending,
      bookingCount,
      bookingsPending,
      bookingsConfirmed,
      paymentStats,
      reviewStats,
      openComplaints,
      messageCount,
      recentBookings,
    ] = await Promise.all([
      users.countDocuments({ role: { $ne: 'admin' } }),
      pgs.countDocuments(),
      pgs.countDocuments({ is_approved: 1 }),
      pgs.countDocuments({ is_approved: 0 }),
      bookings.countDocuments(),
      bookings.countDocuments({ status: 'pending' }),
      bookings.countDocuments({ status: 'confirmed' }),
      payments.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).next(),
      reviews.aggregate([
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } },
      ]).next(),
      complaints.countDocuments({ status: 'open' }),
      messages.countDocuments(),
      bookings.aggregate([
        { $match: { created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1 } },
      ]).toArray(),
    ]);

    return NextResponse.json({
      stats: {
        users: userCount,
        pgs: pgCount,
        pgsApproved,
        pgsPending,
        bookings: bookingCount,
        bookingsPending,
        bookingsConfirmed,
        totalRevenue: paymentStats?.total || 0,
        totalPayments: paymentStats?.count || 0,
        reviews: reviewStats?.count || 0,
        avgRating: Math.round((reviewStats?.avg || 0) * 10) / 10,
        openComplaints,
        messages: messageCount,
      },
      recentBookings,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
