// Staff index page 
import { useState } from 'react';
import axios from 'axios';

export default function StaffDashboard() {
  const [formData, setFormData] = useState({
    binId: '',
    bookQuantity: '',
    actualQuantity: '',
    notes: '',
    location: ''
  });
  const [message, setMessage] = useState('');

  const { binId, bookQuantity, actualQuantity, notes, location } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/inventory', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
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
        location: ''
      });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error submitting entry');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Inventory Entry Form</h2>
        
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
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
