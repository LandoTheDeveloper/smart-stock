import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token found.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5173/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');
          // Optional: Redirect to login after 3 seconds
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Server error. Please try again later.');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Verifying...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Done!</h1>
            <p className="mt-2 text-gray-600">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Verification Failed</h1>
            <p className="mt-2 text-gray-600">{message}</p>
            <button 
              onClick={() => navigate('/register')}
              className="mt-6 w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Back to Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;