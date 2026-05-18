import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aurion_secret_key_2026';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user; // Entire user object with role and permissions
        req.token = token;
        next();
    } catch (error) {
        console.error('Local Auth Error:', error.message);
        res.status(401).json({ message: 'Authentication failed' });
    }
};

export const authorize = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const hasAllPermissions = permissions.every(permission => 
            req.user.permissions.includes(permission)
        );

        if (!hasAllPermissions) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient role permissions' });
        }

        next();
    };
};

export const checkJobOwnership = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const job = await JobRequisition.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Allow if user is HR or has manage_users permission
        if (req.user.role === 'hr' || req.user.hasPermission('manage_users')) {
            return next();
        }

        // Check if user is the creator or in the same department
        if (job.created_by.toString() === req.user._id.toString() || 
            job.department === req.user.department) {
            return next();
        }

        res.status(403).json({ message: 'Access denied' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};