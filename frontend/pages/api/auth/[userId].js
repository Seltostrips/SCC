// SCC-main/frontend/pages/api/auth/approve/[userId].js

import axios from 'axios';

export default async function handler(req, res) {
  const { userId } = req.query; // Get the dynamic userId from the URL
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  if (req.method === 'POST') {
    try {
      // Forward the POST request to your backend API
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/approve/${userId}`,
        {}, // Empty body as the backend expects no body for this POST
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error in Next.js API proxy for user approval:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        message: error.response?.data?.message || 'Error approving user via proxy' 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
