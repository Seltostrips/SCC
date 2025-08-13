// Me endpoint 
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
}
