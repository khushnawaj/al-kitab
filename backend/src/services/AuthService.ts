import bcryptjs from 'bcryptjs';
import { userRepository } from '../repositories/UserRepository.js';
import { refreshTokenRepository } from '../repositories/RefreshTokenRepository.js';
import { goalRepository } from '../repositories/GoalRepository.js';
import { recitationRepository } from '../repositories/RecitationRepository.js';
import { counterRepository } from '../repositories/CounterRepository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { IUser } from '../models/User.js';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ur_roman' | 'ur';
  role: 'user' | 'admin';
  createdAt?: Date;
}

export const formatUserResponse = (user: IUser | any): UserResponse => ({
  id: user._id?.toString() || user.id?.toString(),
  name: user.name,
  email: user.email,
  theme: user.theme || 'system',
  language: user.language || 'en',
  role: user.role || 'user',
  ...(user.createdAt ? { createdAt: user.createdAt } : {}),
});

export class AuthService {
  async register(
    name: string,
    email: string,
    password: string,
    language?: 'en' | 'ur_roman' | 'ur',
    theme?: 'light' | 'dark' | 'system'
  ) {
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
      user: formatUserResponse(user),
      accessToken,
      refreshToken,
      expiryDays: 7,
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

    const expiryDays = rememberMe ? 30 : 7;
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString(), expiryDays);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    await refreshTokenRepository.create(refreshToken, user._id.toString(), expiresAt);

    return {
      user: formatUserResponse(user),
      accessToken,
      refreshToken,
      expiryDays,
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
      // Refresh token rotation: delete old token, generate new pair
      await refreshTokenRepository.deleteByToken(token);

      const newAccessToken = generateAccessToken(decoded.userId);
      const newRefreshToken = generateRefreshToken(decoded.userId);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await refreshTokenRepository.create(newRefreshToken, decoded.userId, expiresAt);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiryDays: 7,
      };
    } catch {
      await refreshTokenRepository.deleteByToken(token);
      throw { status: 401, message: 'Invalid refresh token signature' };
    }
  }

  async logout(token?: string, userId?: string) {
    if (token) {
      await refreshTokenRepository.deleteByToken(token);
    }
    if (userId) {
      // Invalidate active refresh tokens for the user
      await refreshTokenRepository.deleteAllByUserId(userId);
    }
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    return formatUserResponse(user);
  }

  async updateProfile(
    userId: string,
    name?: string,
    email?: string,
    theme?: 'light' | 'dark' | 'system',
    language?: 'en' | 'ur_roman' | 'ur'
  ): Promise<UserResponse> {
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

    return formatUserResponse(updatedUser);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
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
    // Invalidate refresh tokens on password change for security
    await refreshTokenRepository.deleteAllByUserId(userId);
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

  async deleteAccount(userId: string): Promise<void> {
    // Clean up all user data across all collections:
    await Promise.all([
      goalRepository.deleteByUserId(userId),
      recitationRepository.deleteAllByUserId(userId),
      counterRepository.deleteAllByUserId(userId),
      refreshTokenRepository.deleteAllByUserId(userId),
    ]);
    await userRepository.delete(userId);
  }
}

export const authService = new AuthService();
