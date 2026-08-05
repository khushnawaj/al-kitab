import { verifyAccessToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/UserRepository.js';
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        req.user = { userId: decoded.userId };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired access token.',
        });
    }
};
export const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const user = await userRepository.findById(req.user.userId);
        if (!user || user.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Forbidden. Admin role required.' });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error checking admin privileges.' });
    }
};
