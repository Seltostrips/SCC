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
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'entryForm' ? 'border-indigo-500 text-indigo-600' :
