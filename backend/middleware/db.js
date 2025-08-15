    // SCC-main(4)/SCC-main/backend/middleware/db.js
    const mongoose = require('mongoose');

    const checkDBConnection = (req, res, next) => {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database connection not established. Please try again later.' });
      }
      next();
    };

    module.exports = { checkDBConnection };
    
