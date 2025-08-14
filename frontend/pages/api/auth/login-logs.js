// SCC-main/frontend/pages/api/auth/login-logs.js

import axios from 'axios';

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Forward the request to your backend API
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login-logs`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error in Next.js API proxy for login logs:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error fetching login logs' 
    });
  }
}
