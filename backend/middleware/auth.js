        // SCC-main(4)/SCC-main/backend/middleware/auth.js
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');

        module.exports = async (req, res, next) => {
          try {
            const authHeader = req.header('Authorization');
            if (!authHeader) {
              return res.status(401).json({ message: 'No Authorization header' });
            }
            const token = authHeader.replace('Bearer ', '');
            if (!token) {
              return res.status(401).json({ message: 'Token not found in Authorization header' });
            }

            // Add a console log here to see the token being verified
            console.log('Token received for verification:', token);
            console.log('JWT_SECRET used:', process.env.JWT_SECRET ? '***** (present)' : 'NOT SET'); // Check if secret is loaded

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded JWT:', decoded); // Log decoded payload

            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
              console.log('User not found for decoded ID:', decoded.id);
              throw new Error('User not found'); // More specific error
            }

            req.user = user;
            next();
          } catch (error) {
            console.error('Auth middleware error:', error.message); // Log the specific error message from jwt.verify or other issues
            res.status(401).json({ message: 'Not authorized' });
          }
        };
        
