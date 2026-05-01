import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getCollections } from '@/lib/db';

export async function PUT(request) {
  try {
    const tokenUser = getUserFromRequest(request);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatar_url } = body;

    const { users } = await getCollections();
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatar_url !== undefined) updateFields.avatar_url = avatar_url;

    await users.updateOne(
      { id: tokenUser.id },
      { $set: updateFields }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const tokenUser = getUserFromRequest(request);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { users } = await getCollections();
    const user = await users.findOne(
      { id: tokenUser.id },
      { projection: { _id: 0, id: 1, name: 1, email: 1, phone: 1, role: 1, city: 1, created_at: 1, avatar_url: 1 } }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
