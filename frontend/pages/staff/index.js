import { useState, useEffect } from 'react';
import axios from 'axios';
import withAuth from '../../components/withAuth';
import { Html5QrcodeScanner } from 'html5-qrcode'; // Import the scanner

function StaffDashboard({ user }) {
  const [formData, setFormData] = useState({
    binId: '',
    bookQuantity: '',
    actualQuantity: '',
    notes: '',
    location: '',
    uniqueCode: '',
    pincode: '',
    qrCode: '' // New field for QR code
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uniqueCodes, setUniqueCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('entryForm');
  const [staffEntries, setStaffEntries] = useState([]);
  const [qrScanner, setQrScanner] = useState(null); // State to hold the scanner instance

  useEffect(() => {
    fetchUniqueCodes();
    if (activeTab === 'ticketStatus') {
      fetchStaffEntries();
    }
  }, [activeTab]);

  // Effect for QR code scanner
  useEffect(() => {
    if (activeTab === 'entryForm') {
      const scannerId = "qr-reader";
      const html5QrCodeScanner = new Html5QrcodeScanner(
        scannerId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`QR Code detected: ${decodedText}`);
        setFormData(prev => ({ ...prev, qrCode: decodedText }));
        setMessage('QR Code scanned successfully!');
        // Optionally stop the scanner after a successful scan
        html5QrCodeScanner.clear();
      };

      const onScanError = (errorMessage) => {
        // console.warn(`QR Code scan error: ${errorMessage}`);
      };

      html5QrCodeScanner.render(onScanSuccess, onScanError);
      setQrScanner(html5QrCodeScanner); // Store the scanner instance

      return () => {
        // Cleanup function: stop the scanner when component unmounts or tab changes
        if (qrScanner) {
          qrScanner.clear().catch(err => console.error("Failed to clear QR scanner", err));
        }
      };
    } else {
      // If switching away from entryForm, clear the scanner
      if (qrScanner) {
        qrScanner.clear().catch(err => console.error("Failed to clear QR scanner", err));
        setQrScanner(null);
      }
    }
  }, [activeTab]); // Re-initialize scanner when activeTab changes

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

  const { binId, bookQuantity, actualQuantity, notes, location, uniqueCode, pincode, qrCode } = formData; // Include qrCode

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
        setMessage('Entry submitted and auto-approved!');
      } else {
        setMessage('Entry submitted successfully! Pending client review.');
      }
      // Reset form
      setFormData({
        binId: '',
        bookQuantity: '',
        actualQuantity: '',
        notes: '',
        location: '',
        uniqueCode: '',
        pincode: '',
        qrCode: ''
      });
    } catch (err) {
      console.error('Error submitting form:', err.response?.data || err.message);
      setMessage(err.response?.data?.message || 'Error submitting entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Staff Dashboard</h1>
          <p className="text-gray-600 mb-6">Welcome, {user.name}!</p>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'entryForm' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('entryForm')}
              >
                Entry Form
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'ticketStatus' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('ticketStatus')}
              >
                Ticket Status
              </button>
            </nav>
          </div>

          {/* Entry Form Tab Content */}
          {activeTab === 'entryForm' && (
            <div className="bg-white shadow rounded-lg p-6">
              {/* QR Reader Div */}
              <div id="qr-reader" style={{ width: '500px', margin: '20px auto' }}></div>
              
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bin ID</label>
                  <input
                    type="text"
                    name="binId"
                    value={binId}
                    onChange={onChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Book Quantity</label>
                  <input
                    type="number"
                    name="bookQuantity"
                    value={bookQuantity}
                    onChange={onChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Quantity</label>
                  <input
                    type="number"
                    name="actualQuantity"
                    value={actualQuantity}
                    onChange={onChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={location}
                    onChange={onChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Client (Unique Code)</label>
                  <select
                    name="uniqueCode"
                    value={uniqueCode}
                    onChange={onUniqueCodeChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a client</option>
                    {uniqueCodes.map((client) => (
                      <option key={client.uniqueCode} value={client.uniqueCode}>
                        {client.company} ({client.uniqueCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={pincode}
                    onChange={onChange}
                    required
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">QR Code</label>
                  <input
                    type="text"
                    name="qrCode"
                    value={qrCode}
                    onChange={onChange}
                    placeholder="Scan QR code or enter manually"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                  <textarea
                    name="notes"
                    value={notes}
                    onChange={onChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-4 p-4 rounded-md ${message.includes('successfully') || message.includes('auto-approved') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {message}
                </div>
              )}
            </div>
          )}

          {/* Ticket Status Tab Content */}
          {activeTab === 'ticketStatus' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Submitted Entries</h2>
              
              {staffEntries.length === 0 ? (
                <p className="text-gray-500">No entries submitted yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bin ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discrepancy</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Comment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffEntries.map((entry) => (
                        <tr key={entry._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.binId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.bookQuantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.actualQuantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.clientId?.name || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.status === 'pending-client' ? 'Client Pending Approval' : 
                             entry.status === 'recount-required' ? 'Recounting Needed' : 
                             entry.status === 'auto-approved' ? 'Auto Approved' : 
                             entry.status === 'client-approved' ? 'Client Approved' : entry.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.discrepancy}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.clientResponse?.comment || 'N/A'}</td>
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
    </div>
  );
}

export default withAuth(StaffDashboard, 'staff');
