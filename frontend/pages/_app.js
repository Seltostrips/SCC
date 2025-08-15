import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { io } from 'socket.io-client'; // Ensure io is imported correctly

let socket;

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Add a console log here to see the token being sent
          console.log("Token sent to /api/auth/me:", token);
          const res = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log("Auth successful:", res.data);
          // Handle both response structures: { user: ... } and direct user object
          const userData = res.data.user || res.data;
          setUser(userData);
          setAuthError(null);

          // Initialize socket connection
          if (typeof window !== 'undefined') {
            // Disconnect existing socket if any
            if (socket) {
              socket.disconnect();
            }
            
            // Get the backend URL without the protocol for socket.io
            const backendUrl = process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, '');
            
            socket = io(`https://${backendUrl}`, {
              transports: ['websocket', 'polling'],
              timeout: 5000,
              forceNew: true
            });

            socket.on('connect', () => {
              console.log('Socket connected successfully');
            });

            socket.on('connect_error', (err) => {
              console.log('Socket connection error:', err.message);
            });

            // Join role-based room and a personal room for user-specific notifications
            socket.emit('join-room', userData.role);
            socket.emit('join-room', userData._id); // Join a room specific to the user's ID

            // Listen for new pending entries (for clients)
            if (userData.role === 'client') {
              socket.on(`new-pending-entry-${userData._id}`, (entry) => { // Listen on specific client ID
                alert('New inventory entry requires your review!');
              });
            }

            // Listen for entry updates (for staff)
            if (userData.role === 'staff') {
              socket.on(`entry-updated-${userData._id}`, (entry) => { // Listen on specific staff ID
                if (entry.status === 'recount-required') { // Only alert if it's a recount request
                  alert('Recount required for one of your entries!');
                }
              });
            }

            // Listen for new approval requests (for admins)
            if (userData.role === 'admin') {
              socket.on('new-approval-request', (data) => {
                alert(`New user pending approval: ${data.message}`);
                // Optionally, trigger a re-fetch of pending approvals in AdminDashboard
                // This would require a way to trigger a function in AdminDashboard from _app.js
                // For simplicity, an alert is used here.
              });
            }

            // Listen for user approval notification (for staff/client)
            if (userData.role === 'staff' || userData.role === 'client') {
              socket.on('user-approved', (data) => {
                if (data.userId === userData._id) {
                  alert(data.message);
                  // Optionally, force a re-check of auth status or redirect
                  // router.reload(); // Or fetch user data again
                }
              });
            }
          }
        } catch (err) {
          console.error('Auth error:', err.response?.data || err.message); // More detailed error logging
          setAuthError(err.response?.data?.message || 'Authentication failed');
          localStorage.removeItem('token');
          setUser(null);
          if (socket) socket.disconnect(); // Disconnect socket on auth error
        }
      } else {
        setUser(null);
        if (socket) socket.disconnect(); // Disconnect socket if no token
      }
      setLoading(false);
    };
    checkAuth();
  }, [router.pathname]); // Depend on router.pathname to re-check auth on route changes

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (socket) socket.disconnect();
    router.push('/login');
  };

  // Don't show navbar on login and register pages
  const showNavbar = user && router.pathname !== '/login' && router.pathname !== '/register';

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      {showNavbar && (
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Inventory Audit Control Portal</h1>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700 mr-4">
                  Welcome, {user.name} ({user.role})
                </span>
                <button
                  onClick={logout}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {authError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Authentication Error:</strong>
          <span className="block sm:inline"> {authError}</span>
        </div>
      )}

      <Component {...pageProps} user={user} />
    </div>
  );
}

export default MyApp;
