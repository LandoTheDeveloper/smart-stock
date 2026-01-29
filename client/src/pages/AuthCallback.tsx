import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const { refreshMe } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('auth.token', token);
            refreshMe()
                .then(() => {
                    // If refreshMe succeeds (or fails gracefully), we try to go to dashboard.
                    // If token was invalid, refreshMe might have cleared it, so we can check if user is set
                    // But refreshMe is async and might take time.
                    // Actually refreshMe catches error and logs out. 
                    // So if we navigate to dashboard, ProtectedRoute will redirect to login if user is null.
                    navigate('/dashboard');
                });
        } else {
            navigate('/login');
        }
    }, [searchParams, refreshMe, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '1.2rem',
            color: '#555'
        }}>
            Logging in...
        </div>
    );
}
