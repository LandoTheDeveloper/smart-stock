import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <main style={{ padding: 24 }}>
      <h2>Welcome, {user?.name}</h2>
      <p>{user?.email}</p>
      <button onClick={logout}>Log out</button>
    </main>
  );
}
