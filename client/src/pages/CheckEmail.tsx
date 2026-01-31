import { Link } from 'react-router-dom';
import logo from '../assets/SmartStockLogo.png';
import './Auth.css';

export default function CheckEmail() {
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

        <Link to="/login" className="auth-btn" style={{ textDecoration: 'none', display: 'block', lineHeight: '40px' }}>
          Return to Login
        </Link>

        <div className='auth-link' style={{ marginTop: '20px' }}>
          Entered the wrong email? <Link to='/signup'>Sign up again</Link>
        </div>
      </div>
    </div>
  );
}