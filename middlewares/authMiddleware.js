// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');

exports.authenticateToken = async (req, res, next) => {
    const token = req.header('Authorization');
    
    // if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //     try {
    //         token = req.headers.authorization.split(' ')[1];
    //         const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //         req.user = await Candidate.findById(decoded.id).select('-password');
    //         next();
    //     } catch (error) {
    //         return res.status(401).json({ message: 'Not authorized, token failed' });
    //     }
    // }

    console.log('Received token:', token);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ message: 'Forbidden', error: error.message });
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};


const protectAdmin = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                return res.status(401).json({ success: false, message: 'Admin not found' });
            }

            // Allow super_admin to bypass all permission checks
            if (req.admin.role === 'super_admin') {
                return next();
            }

            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
};


module.exports = { protectAdmin };