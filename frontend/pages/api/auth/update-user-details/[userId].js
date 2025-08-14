// SCC-main/frontend/pages/api/auth/update-user-details/[userId].js

import axios from 'axios';

export default async function handler(req, res) {
  const { userId } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  if (req.method === 'PUT') {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-user-details/${userId}`,
        req.body, // Forward the request body (company, city)
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error in Next.js API proxy for updating user details:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        message: error.response?.data?.message || 'Error updating user details via proxy' 
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
