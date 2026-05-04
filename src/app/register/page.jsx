'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { UserPlus, Mail, Lock, User, Phone, MapPin, GraduationCap, Building2, Eye, EyeOff } from 'lucide-react';
import { CITY_OPTIONS } from '@/lib/cities';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
    city: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        login(data.user, data.token);
        router.push(data.user.role === 'owner' ? '/owner/dashboard' : '/');
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
        <p className="auth-subtitle"><strong>Join KloudPG and find your perfect PG</strong> </p>

        {/* Role selector */}
        <div className="role-selector">
          <div
            className={`role-option ${form.role === 'student' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'student' })}
          >
            <GraduationCap size={24} style={{ margin: '0 auto 6px', display: 'block', color: form.role === 'student' ? 'var(--primary-light)' : 'var(--text-muted)' }} />
            <h4>Student</h4>
            <p>Looking for a PG</p>
          </div>
          <div
            className={`role-option ${form.role === 'owner' ? 'active' : ''}`}
            onClick={() => setForm({ ...form, role: 'owner' })}
          >
            <Building2 size={24} style={{ margin: '0 auto 6px', display: 'block', color: form.role === 'owner' ? 'var(--primary-light)' : 'var(--text-muted)' }} />
            <h4>PG Owner</h4>
            <p>List my property</p>
          </div>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '16px', padding: '12px', background: '#FFF5F5', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Aishwarya Ghadage"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                id="register-name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
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
                  id="register-email"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  id="register-phone"
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '40px', paddingRight: '44px' }}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  id="register-password"
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
            <div className="form-group">
              <label className="form-label">City</label>
              <select
                className="form-select"
                style={{ color: form.city ? 'var(--text-heading)' : 'var(--text-secondary)' }}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                id="register-city"
              >
                <option value="">Select City</option>
                {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} id="register-submit">
            {loading ? 'Creating account...' : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
