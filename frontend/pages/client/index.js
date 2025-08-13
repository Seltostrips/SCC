import { useState, useEffect } from 'react';
import axios from 'axios';
import withAuth from '../../components/withAuth';

function ClientDashboard({ user }) {
  const [pendingEntries, setPendingEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingEntries();
  }, []);

  const fetchPendingEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/inventory/pending', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPendingEntries(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending entries:', err);
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/inventory/${selectedEntry._id}/respond`, {
        action: 'approved'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPendingEntries(pendingEntries.filter(entry => entry._id !== selectedEntry._id));
      setSelectedEntry(null);
    } catch (err) {
      console.error('Error accepting entry:', err);
    }
  };

  const handleReject = async () => {
    if (!rejectionComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/inventory/${selectedEntry._id}/respond`, {
        action: 'rejected',
        comment: rejectionComment
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPendingEntries(pendingEntries.filter(entry => entry._id !== selectedEntry._id));
      setSelectedEntry(null);
      setRejectionComment('');
    } catch (err) {
      console.error('Error rejecting entry:', err);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Client Dashboard</h1>
        <p className="text-center mb-6">Welcome, {user.name}</p>
        
        {/* Rest of the component remains the same */}
        {/* ... (copy the rest from the original client/index.js) */}
      </div>
    </div>
  );
}

export default withAuth(ClientDashboard, 'client');
