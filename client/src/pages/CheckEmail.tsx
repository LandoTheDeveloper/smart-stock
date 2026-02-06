import { Link } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/SmartStockLogo.png';
import './Auth.css';

export default function CheckEmail() {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');

    try {
      const email = localStorage.getItem('pendingVerificationEmail');
      
      if (!email) {
        setMessage('Email not found. Please sign up again.');
        setIsResending(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5001';
      
      const response = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Verification email sent! Check your inbox.');
        
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setMessage(data.message || 'Failed to send email. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };
  
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

        <div className='auth-title'>Check your email</div>
        
        <div style={{ margin: '20px 0', lineHeight: '1.6', color: '#555' }}>
          <p>
            We've sent a verification link to your email address. 
            Please click the link to activate your account.
          </p>
          <p style={{ fontSize: '0.9rem', marginTop: '10px', color: '#888' }}>
            Don't see it? Check your spam folder.
          </p>
        </div>

        {message && (
          <div style={{ 
            margin: '15px 0', 
            padding: '10px', 
            borderRadius: '5px',
            backgroundColor: message.includes('✓') ? '#d4edda' : '#f8d7da',
            color: message.includes('✓') ? '#155724' : '#721c24',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        <a 
          onClick={handleResend}
          style={{ 
            marginBottom: '15px',
            opacity: (isResending || countdown > 0) ? 0.6 : 1,
            cursor: (isResending || countdown > 0) ? 'not-allowed' : 'pointer',
            color: '#155724',
            fontSize: 13
          }}
        >
          {isResending 
            ? 'Sending...' 
            : countdown > 0 
              ? `Resend in ${countdown}s` 
              : 'Resend verification email'}
        </a>

        <Link to="/login" className="auth-btn" style={{ 
          textDecoration: 'none', 
          display: 'block', 
          lineHeight: '40px',
          marginTop: '10px'
        }}>
          Return to Login
        </Link>

        <div className='auth-link' style={{ marginTop: '20px' }}>
          Entered the wrong email? <Link to='/signup'>Sign up again</Link>
        </div>
      </div>
    </div>
  );
}