import { authService } from '../services/AuthService.js';
export class AuthController {
    async register(req, res, next) {
        try {
            const { name, email, password, language, theme } = req.body;
            const result = await authService.register(name, email, password, language, theme);
            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password, rememberMe } = req.body;
            const result = await authService.login(email, password, rememberMe);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({ success: false, message: 'Refresh token is required' });
                return;
            }
            const result = await authService.refresh(refreshToken);
            res.status(200).json({
                success: true,
                message: 'Access token refreshed successfully',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const profile = await authService.getProfile(userId);
            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: profile
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const { name, email, theme, language } = req.body;
            const profile = await authService.updateProfile(userId, name, email, theme, language);
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: profile
            });
        }
        catch (error) {
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const userId = req.user.userId;
            const { oldPassword, newPassword } = req.body;
            await authService.changePassword(userId, oldPassword, newPassword);
            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyPassword(req, res, next) {
        try {
            const userId = req.user.userId;
            const { password } = req.body;
            const isValid = await authService.verifyPassword(userId, password);
            res.status(200).json({
                success: true,
                data: { isValid }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteAccount(req, res, next) {
        try {
            const userId = req.user.userId;
            await authService.deleteAccount(userId);
            res.status(200).json({
                success: true,
                message: 'Account deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const authController = new AuthController();
