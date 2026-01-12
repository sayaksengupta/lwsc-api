const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const adminAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.header('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: { code: 'NO_TOKEN' } });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findOne({ _id: decoded.id, isActive: true });
    if (!admin) return res.status(401).json({ error: { code: 'INVALID_TOKEN' } });

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token expired or invalid' } });
  }
};

module.exports = { adminAuth };