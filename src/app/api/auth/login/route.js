import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { comparePassword, createToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { users } = await getCollections();
    const user = await users.findOne({ email });

    if (!user || !comparePassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    if (user.is_blocked) {
      return NextResponse.json({ error: 'Your account is blocked' }, { status: 403 });
    }

    const tokenUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = createToken(tokenUser);

    const response = NextResponse.json({ user: tokenUser, token });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
