import { useState, useEffect } from 'react';
import axios from 'axios';
import withAuth from '../../components/withAuth';

function AdminDashboard({ user }) {
  const [entries, setEntries] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    location: '',
    staff: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.location) params.append('location', filters.location);
      if (filters.staff) params.append('staff', filters.staff);
      
      const res = await axios.get(`/api/inventory?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setEntries(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setLoading(false);
    }
  };

  // Rest of the component remains the same
  // ... (copy the rest from the original admin/index.js)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <p className="text-center mb-6">Welcome, {user.name}</p>
        
        {/* Rest of the component remains the same */}
        {/* ... (copy the rest from the original admin/index.js) */}
      </div>
    </div>
  );
}

export default withAuth(AdminDashboard, 'admin');
