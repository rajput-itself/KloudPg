import { NextResponse } from 'next/server';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { getCollections } from '@/lib/db';

export async function PUT(request) {
  try {
    const tokenUser = getUserFromRequest(request);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { users } = await getCollections();
    const user = await users.findOne({ id: tokenUser.id });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a password set (Google users may not)
    if (!user.password_hash) {
      return NextResponse.json({ error: 'Cannot change password for Google account' }, { status: 400 });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Update password
    const hashedPassword = hashPassword(newPassword);
    await users.updateOne(
      { id: tokenUser.id },
      { $set: { password_hash: hashedPassword } }
    );

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
