import { useState, useEffect } from 'react';
import axios from 'axios';
import withAuth from '../../components/withAuth';

function StaffDashboard({ user }) {
  const [formData, setFormData] = useState({
    binId: '',
    bookQuantity: '',
    actualQuantity: '',
    notes: '',
    location: '',
    uniqueCode: '',
    pincode: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uniqueCodes, setUniqueCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('entryForm'); // New state for active tab
  const [staffEntries, setStaffEntries] = useState([]); // New state for staff's entries

  useEffect(() => {
    fetchUniqueCodes();
    if (activeTab === 'ticketStatus') {
      fetchStaffEntries();
    }
  }, [activeTab]); // Re-fetch entries when tab changes

  const fetchUniqueCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/inventory/unique-codes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUniqueCodes(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching unique codes:', err);
      setLoading(false);
    }
  };

  const fetchStaffEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      // For staff, the backend's /api/inventory GET route will implicitly filter by req.user.id
      // if no specific staffId filter is provided in query params.
      // So, we just fetch all entries for the logged-in staff.
      const res = await axios.get('/api/inventory', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStaffEntries(res.data);
    } catch (err) {
      console.error('Error fetching staff entries:', err);
    }
  };

  const { binId, bookQuantity, actualQuantity, notes, location, uniqueCode, pincode } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onUniqueCodeChange = (e) => {
    const selectedCode = e.target.value;
    const selectedClient = uniqueCodes.find(client => client.uniqueCode === selectedCode);
    
    setFormData({
      ...formData,
      uniqueCode: selectedCode,
      pincode: selectedClient ? selectedClient.location.pincode : ''
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Submitting form with data:', formData);
      
      const res = await axios.post('/api/inventory', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Response:', res.data);
      
      if (res.data.status === 'auto-approved') {
        setMessage('Entry auto-approved!');
      } else {
        setMessage('Entry sent to client for review');
      }
      
      // Reset form
      setFormData({
        binId: '',
        bookQuantity: '',
        actualQuantity: '',
        notes: '',
        location: '',
        uniqueCode: '',
        pincode: ''
      });
      // Refresh staff entries if on the ticket status tab
      if (activeTab === 'ticketStatus') {
        fetchStaffEntries();
      }
    } catch (err) {
      console.error('Error submitting entry:', err);
      setMessage(err.response?.data?.message || 'Error submitting entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending-client':
        return 'text-orange-500';
      case 'recount-required':
        return 'text-red-500';
      default:
        return 'text-gray-900';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Staff Dashboard</h2>
        <p className="text-center mb-6">Welcome, {user.name}</p>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('entryForm')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'entryForm'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Entry Form
            </button>
            <button
              onClick={() => setActiveTab('ticketStatus')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ticketStatus'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ticket Status
            </button>
          </nav>
        </div>

        {/* Entry Form Tab Content */}
        {activeTab === 'entryForm' && (
          <>
            {message && (
              <div className={`mb-4 p-3 rounded ${message.includes('auto-approved') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label htmlFor="binId" className="block text-gray-700 font-medium mb-2">Rack/Bin ID</label>
                <input
                  type="text"
                  id="binId"
                  name="binId"
                  value={binId}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="bookQuantity" className="block text-gray-700 font-medium mb-2">Book Quantity</label>
                <input
                  type="number"
                  id="bookQuantity"
                  name="bookQuantity"
                  value={bookQuantity}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="actualQuantity" className="block text-gray-700 font-medium mb-2">Actual Count</label>
                <input
                  type="number"
                  id="actualQuantity"
                  name="actualQuantity"
                  value={actualQuantity}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="uniqueCode" className="block text-gray-700 font-medium mb-2">Client Code</label>
                <select
                  id="uniqueCode"
                  name="uniqueCode"
                  value={uniqueCode}
                  onChange={onUniqueCodeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a client</option>
                  {uniqueCodes.map((client) => (
                    <option key={client._id} value={client.uniqueCode}>
                      {client.company} - {client.uniqueCode} ({client.location.city})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="pincode" className="block text-gray-700 font-medium mb-2">Pincode</label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={pincode}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  readOnly
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="location" className="block text-gray-700 font-medium mb-2">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={location}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="notes" className="block text-gray-700 font-medium mb-2">Notes (optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </>
        )}

        {/* Ticket Status Tab Content */}
        {activeTab === 'ticketStatus' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h3 className="text-xl font-semibold mb-4 p-4">Your Submitted Entries</h3>
            {staffEntries.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No entries submitted yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bin ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Qty</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Qty</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discrepancy</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Comment</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffEntries.map((entry) => (
                      <tr key={entry._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.binId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.bookQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.actualQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.clientId?.name || 'N/A'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status === 'pending-client' ? 'Client Pending Approval' :
                           entry.status === 'recount-required' ? 'Recounting Needed' :
                           entry.status === 'auto-approved' ? 'Auto Approved' :
                           entry.status === 'client-approved' ? 'Client Approved' : entry.status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.discrepancy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.clientResponse?.comment || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(StaffDashboard, 'staff');
