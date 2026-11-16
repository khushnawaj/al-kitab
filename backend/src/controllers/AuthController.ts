import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { CookiesRequest, REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '../middlewares/cookieParser.js';
import { authService } from '../services/AuthService.js';

type AuthRequest = AuthenticatedRequest & CookiesRequest;

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, language, theme } = req.body;
      const result = await authService.register(name, email, password, language, theme);

      // Set secure HTTP-only refresh cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(result.expiryDays));

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, rememberMe } = req.body;
      const result = await authService.login(email, password, rememberMe);

      // Set secure HTTP-only refresh cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(result.expiryDays));

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Support reading from cookie first, falling back to body
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required (cookie or request body)'
        });
        return;
      }

      const result = await authService.refresh(refreshToken);

      // Set rotated refresh cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions(result.expiryDays));

      res.status(200).json({
        success: true,
        message: 'Access token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }
      });
    } catch (error) {
      // Clear cookie on invalid refresh
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const userId = req.user?.userId;

      await authService.logout(refreshToken, userId);

      // Clear cookie
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await authService.getProfile(userId);
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { name, email, theme, language } = req.body;
      const profile = await authService.updateProfile(userId, name, email, theme, language);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { oldPassword, newPassword } = req.body;
      await authService.changePassword(userId, oldPassword, newPassword);

      // Clear refresh cookie since tokens were invalidated
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { password } = req.body;
      const isValid = await authService.verifyPassword(userId, password);
      res.status(200).json({
        success: true,
        data: { isValid }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await authService.deleteAccount(userId);

      // Clear cookie
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });

      res.status(200).json({
        success: true,
        message: 'Account and all related records deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
