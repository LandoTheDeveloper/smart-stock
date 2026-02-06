import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/SmartStockLogo.png';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token found');
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';
        console.log('API URL:', apiUrl); // Debug log
        console.log('Token:', token); // Debug log
        
        const response = await fetch(`${apiUrl}/api/auth/verify-email?token=${token}`);
        console.log('Response status:', response.status); // Debug log
        
        const data = await response.json();
        console.log('Response data:', data); // Debug log

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          
          // Clear the pending email from localStorage
          localStorage.removeItem('pendingVerificationEmail');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed D:');
        }
      } catch (error: any) {
        console.error('Verification error:', error); // Debug log
        setStatus('error');
        setMessage(error.message || 'Server error. Please try again later.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

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
                Redirecting to login in 3 seconds...
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