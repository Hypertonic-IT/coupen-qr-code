const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

module.exports = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1] || req.query.token;

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify admin still exists (handles database resets)
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ message: 'Session expired or admin deleted. Please login again.' });
        }
        
        req.adminId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
