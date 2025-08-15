// SCC-main/SCC-main/frontend/pages/api/auth/login.js
// Login endpoint 
import axios from 'axios';

export default async function handler(req, res) {
  try {
    // The req.body already contains email, password, role, and pincode
    // No explicit destructuring needed here, just forward req.body
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, req.body); // req.body is forwarded as is
    
    res.status(200).json(response.data);
  } catch (error) {
    // It's good practice to log the full error response from the backend here too
    console.error('Proxy login error:', error.response?.data || error.message);
    res.status(400).json({ message: error.response?.data?.message || 'Login failed' });
  }
}
