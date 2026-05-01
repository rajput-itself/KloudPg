'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Something went wrong');
      else setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
              <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto' }} />
            </div>
            <h1 style={{ marginBottom: '12px' }}>Check Your Email</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              Please check your inbox (and spam folder).
            </p>
            <Link href="/login" className="btn btn-primary btn-full">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px', display: 'inline-flex' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
            <h1>Reset Password 🔐</h1>
            <p className="auth-subtitle">Enter your email to receive a reset link</p>
            {error && (
              <div className="form-error" style={{ marginBottom: '16px', padding: '12px', background: '#FFF5F5', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '40px' }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    id="forgot-email"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="forgot-submit">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
