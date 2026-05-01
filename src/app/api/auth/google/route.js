import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getCollections, insertDoc } from '@/lib/db';
import { createToken, hashPassword } from '@/lib/auth';

const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;

async function verifyGoogleCredential(credential) {
  const res = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(credential)}`);

  if (!res.ok) {
    return null;
  }

  const profile = await res.json();

  if (GOOGLE_CLIENT_ID && profile.aud !== GOOGLE_CLIENT_ID) {
    return null;
  }

  if (profile.email_verified !== 'true' && profile.email_verified !== true) {
    return null;
  }

  if (!profile.email) {
    return null;
  }

  return {
    email: profile.email.toLowerCase(),
    name: profile.name || profile.email.split('@')[0],
    avatarUrl: profile.picture || null,
  };
}

export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'Google credential is required' }, { status: 400 });
    }

    const googleProfile = await verifyGoogleCredential(credential);

    if (!googleProfile) {
      return NextResponse.json({ error: 'Invalid Google credential' }, { status: 401 });
    }

    const { users } = await getCollections();
    let dbUser = await users.findOne({ email: googleProfile.email });

    if (!dbUser) {
      const passwordHash = hashPassword(`google:${randomUUID()}`);
      dbUser = await insertDoc(users, 'users', {
        name: googleProfile.name,
        email: googleProfile.email,
        password_hash: passwordHash,
        role: 'student',
        avatar_url: googleProfile.avatarUrl,
        is_blocked: 0,
      });
    } else if (googleProfile.avatarUrl && !dbUser.avatar_url) {
      await users.updateOne({ id: dbUser.id }, { $set: { avatar_url: googleProfile.avatarUrl } });
      dbUser.avatar_url = googleProfile.avatarUrl;
    }

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatar_url: dbUser.avatar_url || null,
    };
    const token = createToken(user);

    const response = NextResponse.json({ user, token });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
