import { type FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import logo from '../assets/SmartStockLogo.png';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await signup({ name, email, password });
      nav('/dashboard');
    } catch (e: any) {
      setErr(e?.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-wrap'>
      <div className='auth-card'>
        <div className='auth-brand'>
          <div className='logo'>
            <img
              src={logo}
              alt='SmartStock logo'
              style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
            />
          </div>
          <div className='brand-text'></div>
        </div>
        <div className='auth-title'>Create your account</div>

        <form className='auth-form' onSubmit={onSubmit}>
          <label htmlFor='name'>Name</label>
          <input
            id='name'
            className='auth-input'
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete='name'
            required
          />

          <label htmlFor='email'>Email</label>
          <input
            id='email'
            className='auth-input'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type='email'
            autoComplete='email'
            required
          />

          <label htmlFor='password'>Password</label>
          <input
            id='password'
            className='auth-input'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type='password'
            autoComplete='new-password'
            required
          />

          {err && <div style={{ color: 'red', fontSize: '0.9rem' }}>{err}</div>}

          <button className='auth-btn' disabled={loading} type='submit'>
            {loading ? '…' : 'Create account'}
          </button>
        </form>

        <div className='auth-divider'>
          <span>OR</span>
        </div>

        <button
          className='google-btn'
          type='button'
          onClick={() => (window.location.href = 'http://localhost:5001/api/auth/google')}
        >
          <img
            src='https://www.svgrepo.com/show/475656/google-color.svg'
            alt='Google'
            style={{ width: '20px', height: '20px' }}
          />
          Sign up with Google
        </button>

        <div className='auth-link'>
          Already have an account? <Link to='/login'>Log in</Link>
        </div>
      </div>
    </div>
  );
}
