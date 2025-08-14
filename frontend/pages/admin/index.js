import { useState, useEffect } from 'react';
import axios from 'axios';
import withAuth from '../../components/withAuth';

function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [entries, setEntries] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // New state for all users
  const [editingUser , setEditingUser ] = useState(null); // State for user being edited
  const [editCompany, setEditCompany] = useState('');
  const [editCity, setEditCity] = useState('');

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    location: '',
    staff: '',
    uniqueCode: '',
    pincode: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); // Set loading true when tab changes
    if (activeTab === 'dashboard') {
      fetchEntries();
    } else if (activeTab === 'approvals') {
      fetchPendingApprovals();
    } else if (activeTab === 'logs') {
      fetchLoginLogs();
    } else if (activeTab === 'user-management') { // New tab
      fetchAllUsers();
    }
  }, [activeTab]);

  const fetchEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.location) params.append('location', filters.location);
      if (filters.staff) params.append('staff', filters.staff);
      if (filters.uniqueCode) params.append('uniqueCode', filters.uniqueCode);
      if (filters.pincode) params.append('pincode', filters.pincode);
      
      const res = await axios.get(`/api/inventory?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Fetched Entries for Admin Dashboard:', res.data);
      setEntries(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/pending-approvals', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Fetched Pending Approvals:', res.data);
      setPendingApprovals(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      setLoading(false);
    }
  };

  const fetchLoginLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/login-logs', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Fetched Login Logs:', res.data); // Debug log
        setLoginLogs(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching login logs:', err);
        setLoading(false);
      }
    };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/all-users', { // New API endpoint
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAllUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching all users:', err);
      setLoading(false);
    }
  };

  const handleEditUser  = (userToEdit) => {
    setEditingUser (userToEdit);
    setEditCompany(userToEdit.company || '');
    setEditCity(userToEdit.location?.city || '');
  };

  const handleSaveUser Changes = async () => {
    if (!editingUser ) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/auth/update-user-details/${editingUser ._id}`, { // New API endpoint
        company: editCompany,
        city: editCity
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('User  details updated successfully!');
      setEditingUser (null); // Exit editing mode
      fetchAllUsers(); // Refresh the list
    } catch (err) {
      console.error('Error saving user changes:', err);
      alert(err.response?.data?.message || 'Error saving user changes.');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    setLoading(true);
    fetchEntries();
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      location: '',
      staff: '',
      uniqueCode: '',
      pincode: ''
    });
    setLoading(true);
    setTimeout(() => {
      fetchEntries();
    }, 100);
  };

  const handleApproveUser  = async (userId) => {
    try {
      const token = localStorage.getItem('token');
        await axios.post(`/api/auth/approve/${userId}`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh the list
      fetchPendingApprovals();
      alert('User  approved successfully');
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Error approving user');
    }
  };

  const handleExportLogs = () => {
    // Ensure loginLogs is an array before mapping
    if (!Array.isArray(loginLogs) || loginLogs.length === 0) {
      alert('No login logs to export.');
      return;
    }

    const csvData = loginLogs.map(log => ({
      Name: log.name || 'N/A',
      Email: log.email || 'N/A',
      Role: log.role || 'N/A',
      'Last Login': log.lastLogin?.timestamp ? new Date(log.lastLogin.timestamp).toLocaleString() : 'Never',
      'Location': (log.lastLogin?.location?.coordinates && log.lastLogin.location.coordinates.length === 2) ? 
        `${log.lastLogin.location.coordinates[1]}, ${log.lastLogin.location.coordinates[0]}` : 
        'N/A',
      'Registration Date': log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'
    }));
    
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => {
        const value = row[header];
        return `"${value !== null && value !== undefined ? String(value).replace(/"/g, '""') : ''}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'user_login_logs.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <p className="text-center mb-6">Welcome, {user.name}</p>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approvals'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Logs
            </button>
            <button
              onClick={() => setActiveTab('user-management')} // New Tab Button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'user-management'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
          </nav>
        </div>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter location"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name</label>
                  <input
                    type="text"
                    name="staff"
                    value={filters.staff}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter staff name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unique Code</label>
                  <input
                    type="text"
                    name="uniqueCode"
                    value={filters.uniqueCode}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter unique code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={filters.pincode}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter pincode"
                  />
                </div>
             
