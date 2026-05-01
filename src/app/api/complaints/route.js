import { NextResponse } from 'next/server';
import { getCollections, insertDoc, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { subject, description, booking_id } = await request.json();
    if (!subject || !description) return NextResponse.json({ error: 'Subject and description required' }, { status: 400 });

    const { complaints } = await getCollections();
    const complaint = await insertDoc(complaints, 'complaints', {
      user_id: user.id,
      booking_id: booking_id ? toInt(booking_id) : null,
      subject,
      description,
      status: 'open',
      admin_response: null,
      resolved_at: null,
    });
    return NextResponse.json({ id: complaint.id, message: 'Complaint submitted' }, { status: 201 });
  } catch (error) {
    console.error('Complaint POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { complaints, bookings, pgs } = await getCollections();
    const rows = await complaints.find({ user_id: user.id }, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    const bookingRows = await bookings.find({ id: { $in: rows.map((row) => row.booking_id).filter(Boolean) } }, { projection: { _id: 0 } }).toArray();
    const pgRows = await pgs.find({ id: { $in: [...new Set(bookingRows.map((booking) => booking.pg_id))] } }, { projection: { _id: 0, id: 1, name: 1 } }).toArray();
    const bookingById = new Map(bookingRows.map((booking) => [booking.id, booking]));
    const pgById = new Map(pgRows.map((pg) => [pg.id, pg]));

    return NextResponse.json({
      complaints: rows.map((complaint) => {
        const booking = bookingById.get(complaint.booking_id);
        return { ...complaint, pg_name: pgById.get(booking?.pg_id)?.name || null };
      }),
    });
  } catch (error) {
    console.error('Complaint GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
