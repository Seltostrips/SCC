import axios from 'axios';

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/unique-codes`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Forward the response from the backend
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Unique codes error:', error.response?.data);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Failed to fetch unique codes'
    });
  }
}
