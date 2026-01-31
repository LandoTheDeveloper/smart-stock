import { type FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import logo from '../assets/SmartStockLogo.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);

    // Check if password is 8 char or longer
    if (password.length < 8) {
      setErr("Password must be at least 8 characters long.");
      return;
    }
  
    // Check if password has a number
    const hasNumber= /\d/.test(password);
    if (!hasNumber) {
      setErr("Password must contain at least one number.");
      return;
    }

    // Check if password has a special character
    const hasSpecial = /[!@#$%^&*]/.test(password);
    if (!hasSpecial) {
      setErr("Password must contain a special character.");
      return;
    }

    // Check if password matches confirmPassword
    if (password != confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

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

          <div className="input-group">
            <label htmlFor='password'>Password</label>
            <div className="input-container">
              <input
                id='password'
                className='auth-input'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={visible ? 'text' : 'password'}
                autoComplete='new-password'
                required
              />
              <div className="eye-icon" onClick={() => setVisible(!visible)}>
                {visible ? <FaEye/> : <FaEyeSlash/>}
              </div>
            </div>
          </div>
          

          <div className="input-group">
            <label htmlFor='confirm_password'>Confirm Password</label>
            <div className="input-container">
              <input
                id='confirm_password'
                className='auth-input'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={confirmVisible ? 'text' : 'password'}
                autoComplete='new-password'
                required
              />
              <div className="eye-icon" onClick={() => setConfirmVisible(!confirmVisible)}>
                {confirmVisible ? <FaEye/> : <FaEyeSlash/>}
              </div>
            </div>
          </div>
          

          {err && <div style={{ color: 'red', fontSize: '0.9rem' }}>{err}</div>}

          <button className='auth-btn' disabled={loading} type='submit'>
            {loading ? '…' : 'Create account'}
          </button>
        </form>

        <div className='auth-link'>
          Already have an account? <Link to='/login'>Log in</Link>
        </div>
      </div>
    </div>
  );
}
