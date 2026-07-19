const jwt = require('jsonwebtoken');
const db = require('../db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token tidak tersedia' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak memiliki izin.' });
    }
    next();
  };
};

const logActivity = (action, targetTable) => {
  return async (req, res, next) => {
    // Preserve the original end/json function to hook into the response
    const originalJson = res.json;
    res.json = function (body) {
      res.json = originalJson;
      // Extract target_id if available (e.g. from req.params.id or body.id)
      const targetId = req.params.id || (body && body.id) || null;
      
      if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
        db.query(
          `INSERT INTO activity_logs (user_id, action, target_table, target_id, detail, ip_address) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.user.id, 
            action, 
            targetTable, 
            targetId, 
            JSON.stringify(req.body),
            req.ip || req.connection.remoteAddress
          ]
        ).catch(err => console.error('Activity log error:', err));
      }
      return res.json(body);
    };
    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole,
  logActivity
};
