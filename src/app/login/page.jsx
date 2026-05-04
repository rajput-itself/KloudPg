'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const googleButtonRef = useRef(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const finishLogin = (user, token) => {
    login(user, token);
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }
    router.push(user.role === 'owner' ? '/owner/dashboard' : '/dashboard');
  };

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      setError('Google login was cancelled');
      return;
    }

    setError('');
    setGoogleLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Google login failed');
      } else {
        finishLogin(data.user, data.token);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: googleButtonRef.current.offsetWidth || 360,
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setError('Google login could not be loaded');
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        finishLogin(data.user, data.token);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-subtitle"><strong>Sign in to your KloudPG account</strong></p>

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
                placeholder="aish@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                id="login-email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: '44px' }}
                placeholder="Your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="login-submit">
            {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div className="google-login-wrap">
          {GOOGLE_CLIENT_ID ? (
            <>
              <div
                ref={googleButtonRef}
                className={`google-login-button ${googleReady ? 'is-ready' : ''}`}
                aria-hidden={googleLoading}
              />
              {googleLoading ? (
                <div className="google-login-overlay">Signing in with Google...</div>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              className="btn btn-google btn-full btn-lg"
              onClick={() => setError('Add VITE_GOOGLE_CLIENT_ID to enable Google login')}
            >
              <span className="google-logo" aria-hidden="true">G</span>
              Sign in with Google
            </button>
          )}
        </div>

        <div className="auth-divider">or</div>

        {/* <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Demo Credentials</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <strong>Student:</strong> student@demo.com / password123
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <strong>Owner:</strong> owner1@demo.com / password123
          </p>
        </div> */}

        <p className="auth-footer">
          Don&apos;t have an account? <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
