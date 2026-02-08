import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/api/auth/forgot-password', { email });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'If that email exists, a password reset link has been sent. Check your inbox!' 
        });
        setEmail(''); // Clear the form
      }
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to send reset email. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Forgot Password?</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Email Address
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
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
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}