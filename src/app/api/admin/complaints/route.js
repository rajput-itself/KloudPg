import { NextResponse } from 'next/server';
import { addNotification, getCollections, now, toInt } from '@/lib/db';
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
    const { complaints, users, bookings, pgs } = await getCollections();
    const rows = await complaints.find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    const userRows = await users.find(
      { id: { $in: [...new Set(rows.map((complaint) => complaint.user_id))] } },
      { projection: { _id: 0, id: 1, name: 1, email: 1 } }
    ).toArray();
    const bookingRows = await bookings.find(
      { id: { $in: rows.map((complaint) => complaint.booking_id).filter(Boolean) } },
      { projection: { _id: 0 } }
    ).toArray();
    const pgRows = await pgs.find(
      { id: { $in: [...new Set(bookingRows.map((booking) => booking.pg_id))] } },
      { projection: { _id: 0, id: 1, name: 1 } }
    ).toArray();
    const userById = new Map(userRows.map((row) => [row.id, row]));
    const bookingById = new Map(bookingRows.map((row) => [row.id, row]));
    const pgById = new Map(pgRows.map((row) => [row.id, row]));

    return NextResponse.json({
      complaints: rows.map((complaint) => {
        const booking = bookingById.get(complaint.booking_id);
        const complaintUser = userById.get(complaint.user_id);
        return {
          ...complaint,
          user_name: complaintUser?.name || null,
          user_email: complaintUser?.email || null,
          pg_id: booking?.pg_id || null,
          pg_name: pgById.get(booking?.pg_id)?.name || null,
        };
      }),
    });
  } catch (error) {
    console.error('Admin complaints GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = isAdmin(request);
    if (!user) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    const { complaint_id, status, admin_response } = await request.json();
    const complaintId = toInt(complaint_id);
    const { complaints } = await getCollections();
    const complaint = await complaints.findOne({ id: complaintId });
    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });

    const update = { status, admin_response: admin_response || null };
    if (status === 'resolved' || status === 'closed') update.resolved_at = now();
    await complaints.updateOne({ id: complaintId }, { $set: update });
    await addNotification(complaint.user_id, 'Complaint Update', `Your complaint has been updated to: ${status}. ${admin_response || ''}`, 'info', '/dashboard');

    return NextResponse.json({ message: 'Complaint updated' });
  } catch (error) {
    console.error('Admin complaints PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
