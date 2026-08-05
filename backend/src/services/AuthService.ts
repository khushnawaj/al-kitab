import bcryptjs from 'bcryptjs';
import { userRepository } from '../repositories/UserRepository.js';
import { refreshTokenRepository } from '../repositories/RefreshTokenRepository.js';
import { goalRepository } from '../repositories/GoalRepository.js';
import { recitationRepository } from '../repositories/RecitationRepository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { IUser } from '../models/User.js';

export class AuthService {
  async register(name: string, email: string, password: string, language?: 'en' | 'ur_roman' | 'ur', theme?: 'light' | 'dark' | 'system') {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw { status: 400, message: 'Email address already registered' };
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      language: language || 'en',
      theme: theme || 'system',
    });

    // Automatically initialize goals for the new user
    await goalRepository.create({
      user: user._id as any,
      dailyGoal: 10,
      weeklyGoal: 70,
      monthlyGoal: 300,
    });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to DB (7 days expiry)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await refreshTokenRepository.create(refreshToken, user._id.toString(), expiresAt);

    return {
      user: { id: user._id, name: user.name, email: user.email, theme: user.theme || 'system', language: user.language || 'en', role: user.role || 'user' },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string, rememberMe: boolean = false) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const isMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to DB (7 days expiry, or more if remember me is set, let's keep 7 or 30 days)
    const expiryDays = rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    await refreshTokenRepository.create(refreshToken, user._id.toString(), expiresAt);

    return {
      user: { id: user._id, name: user.name, email: user.email, theme: user.theme || 'system', language: user.language || 'en', role: user.role || 'user' },
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    const storedToken = await refreshTokenRepository.findByToken(token);
    if (!storedToken) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    // Check if expired
    if (new Date() > storedToken.expiresAt) {
      await refreshTokenRepository.deleteByToken(token);
      throw { status: 401, message: 'Refresh token expired' };
    }

    try {
      const decoded = verifyRefreshToken(token);
      const newAccessToken = generateAccessToken(decoded.userId);
      // Optional: rotate refresh token
      return { accessToken: newAccessToken };
    } catch (err) {
      await refreshTokenRepository.deleteByToken(token);
      throw { status: 401, message: 'Invalid refresh token signature' };
    }
  }

  async logout(token: string) {
    await refreshTokenRepository.deleteByToken(token);
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      theme: user.theme || 'system', 
      language: user.language || 'en', 
      role: user.role || 'user',
      createdAt: user.createdAt 
    };
  }

  async updateProfile(userId: string, name?: string, email?: string, theme?: 'light' | 'dark' | 'system', language?: 'en' | 'ur_roman' | 'ur') {
    const updateData: Partial<IUser> = {};
    if (name) updateData.name = name;
    if (email) {
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser && existingUser._id.toString() !== userId) {
        throw { status: 400, message: 'Email address already in use by another account' };
      }
      updateData.email = email;
    }
    if (theme) updateData.theme = theme;
    if (language) updateData.language = language;

    const updatedUser = await userRepository.update(userId, updateData);
    if (!updatedUser) {
      throw { status: 404, message: 'User not found' };
    }

    return { 
      id: updatedUser._id, 
      name: updatedUser.name, 
      email: updatedUser.email, 
      theme: updatedUser.theme || 'system', 
      language: updatedUser.language || 'en',
      role: updatedUser.role || 'user'
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const isMatch = await bcryptjs.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      throw { status: 400, message: 'Incorrect old password' };
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(newPassword, salt);

    await userRepository.update(userId, { passwordHash });
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    const isMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 400, message: 'Incorrect password' };
    }
    return true;
  }

  async deleteAccount(userId: string) {
    // Delete goals, refresh tokens, and recitations for the user
    await goalRepository.deleteByUserId(userId);
    await refreshTokenRepository.deleteAllByUserId(userId);
    await recitationRepository.deleteAllByUserId(userId);
    await userRepository.delete(userId);
  }
}
export const authService = new AuthService();
