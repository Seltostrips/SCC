// pages/_app.js
import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

let socket;

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => {
        setUser(res.data.user);
        setLoading(false);
        
        // Initialize socket connection only if window is defined (client-side)
        if (typeof window !== 'undefined') {
          // Dynamically import socket.io-client only on client side
          import('socket.io-client').then((io) => {
            socket = io.default(process.env.NEXT_PUBLIC_API_URL);
            
            // Join role-based room
            socket.emit('join-room', res.data.user.role);
            
            // Listen for new pending entries (for clients)
            if (res.data.user.role === 'client') {
              socket.on('new-pending-entry', (entry) => {
                alert('New inventory entry requires your review!');
              });
            }
            
            // Listen for entry updates (for staff)
            if (res.data.user.role === 'staff') {
              socket.on('entry-updated', (entry) => {
                if (entry.status === 'recount-required' && entry.staffId === res.data.user.id) {
                  alert('Recount required for one of your entries!');
                }
              });
            }
          });
        }
      })
      .catch(err => {
        localStorage.removeItem('token');
        setLoading(false);
        router.push('/login');
      });
    } else {
      setLoading(false);
      if (router.pathname !== '/login' && router.pathname !== '/register') {
        router.push('/login');
      }
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (socket) socket.disconnect();
    router.push('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user && (
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between">
            <div>Inventory Audit Control Portal</div>
            <div>
              <span className="mr-4">Welcome, {user.name} ({user.role})</span>
              <button onClick={logout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}
      <Component {...pageProps} user={user} setUser={setUser} />
    </div>
  );
}

export default MyApp;
