import { NextResponse } from 'next/server';
import { getCollections, insertDoc } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, phone, role, city } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { users } = await getCollections();

    // Check if email exists
    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const record = await insertDoc(users, 'users', {
      name,
      email,
      password_hash: passwordHash,
      phone: phone || null,
      role: role || 'student',
      city: city || null,
      is_blocked: 0,
    });

    const user = { id: record.id, name, email, role: record.role };
    const token = createToken(user);

    const response = NextResponse.json({ user, token }, { status: 201 });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
