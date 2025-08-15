import { useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          // If authenticated, redirect based on role
          const user = res.data.user || res.data;
          if (user.role === 'admin') {
            router.push('/admin');
          } else if (user.role === 'staff') {
            router.push('/staff');
          } else if (user.role === 'client') {
            router.push('/client');
          }
        } catch (err) {
          // If token is invalid, redirect to login
          router.push('/login');
        }
      } else {
        // If no token, redirect to login
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
