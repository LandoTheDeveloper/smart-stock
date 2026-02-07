import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/SmartStockLogo.png';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const [countdown, setCountdown] = useState(3);

  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token found');
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

        const response = await fetch(`${apiUrl}/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          localStorage.removeItem('pendingVerificationEmail');

          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Server error.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  useEffect(() => {
    if (status !== 'success') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, navigate]);

  return (
    <div className='auth-wrap'>
      <div className='auth-card' style={{ textAlign: 'center' }}>
        <div className='auth-brand'>
          <div className='logo'>
            <img 
              src={logo} 
              alt='SmartStock logo' 
              style={{ width: '100%', borderRadius: '12px' }} 
            />
          </div>
        </div>

        <div className='auth-title'>
          {status === 'loading' && 'Verifying your email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed D:'}
        </div>

        <div style={{ margin: '20px 0', lineHeight: '1.6' }}>
          {status === 'loading' && (
            <p style={{ color: '#888' }}>Please wait while we verify your email address.</p>
          )}
          {status === 'success' && (
            <>
              <p style={{ color: '#155724', fontSize: '1.1rem' }}>✓ {message}</p>
              <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '10px' }}>
                Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <p style={{ color: '#721c24', fontSize: '1.1rem' }}>✗ {message}</p>
              <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '10px' }}>
                The verification link may have expired or is invalid.
              </p>
            </>
          )}
        </div>

        {status === 'success' && (
          <button 
            className="auth-btn" 
            onClick={() => navigate('/login')}
            style={{ marginTop: '20px' }}
          >
            Go to Login
          </button>
        )}

        {status === 'error' && (
          <button 
            className="auth-btn" 
            onClick={() => navigate('/signup')}
            style={{ marginTop: '20px' }}
          >
            Back to Sign Up
          </button>
        )}
      </div>
    </div>
  );
}