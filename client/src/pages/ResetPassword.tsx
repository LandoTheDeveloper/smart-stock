import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid or missing reset token' });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid reset token' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        newPassword: password
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to reset password. The link may have expired.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Reset Password</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              New Password
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={!token}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Confirm Password
            </label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={!token}
              style={{ width: '100%' }}
            />
          </div>

          {message && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                background: message.type === 'success' ? 'var(--primary-10)' : 'var(--danger-bg)',
                color: message.type === 'success' ? 'var(--primary)' : 'var(--danger)',
                fontSize: '0.9rem'
              }}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !token}
            style={{ width: '100%' }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}