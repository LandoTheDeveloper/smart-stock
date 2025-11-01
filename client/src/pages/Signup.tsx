import { type FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

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
    <main className='container' style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Create account</h1>
      <form onSubmit={onSubmit}>
        <label>
          Name
          <br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Email
          <br />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type='email'
            required
          />
        </label>
        <br />
        <label>
          Password
          <br />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type='password'
            required
          />
        </label>
        <br />
        {err && <p style={{ color: 'red' }}>{err}</p>}
        <button disabled={loading} type='submit'>
          {loading ? '…' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to='/login'>Log in</Link>
      </p>
    </main>
  );
}
