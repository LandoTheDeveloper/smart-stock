import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  return user ? (
    <Navigate to='/dashboard' replace />
  ) : (
    <Navigate to='/login' replace />
  );
}
