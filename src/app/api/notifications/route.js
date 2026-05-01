import { NextResponse } from 'next/server';
import { getCollections, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { notifications } = await getCollections();
    const rows = await notifications.find({ user_id: user.id }, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(50).toArray();
    const unreadCount = await notifications.countDocuments({ user_id: user.id, is_read: 0 });
    return NextResponse.json({ notifications: rows, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const { notifications } = await getCollections();
    if (body.id) {
      await notifications.updateOne({ id: toInt(body.id), user_id: user.id }, { $set: { is_read: 1 } });
    } else {
      await notifications.updateMany({ user_id: user.id }, { $set: { is_read: 1 } });
    }
    return NextResponse.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
