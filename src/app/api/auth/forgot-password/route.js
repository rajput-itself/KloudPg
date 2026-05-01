import { NextResponse } from 'next/server';

// POST /api/auth/forgot-password — mock password reset
// In production, integrate an email service (SendGrid, Nodemailer, etc.)
export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // Simulate delay
    await new Promise(r => setTimeout(r, 800));

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In production: send actual email with reset token
      demo_note: 'This is a mock implementation. In production, integrate an email service.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
