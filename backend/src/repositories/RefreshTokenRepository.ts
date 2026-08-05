import { RefreshToken, IRefreshToken } from '../models/RefreshToken.js';

export class RefreshTokenRepository {
  async create(token: string, userId: string, expiresAt: Date): Promise<IRefreshToken> {
    const refreshToken = new RefreshToken({
      token,
      user: userId,
      expiresAt,
    });
    return refreshToken.save();
  }

  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token }).populate('user');
  }

  async deleteByToken(token: string): Promise<any> {
    return RefreshToken.deleteOne({ token });
  }

  async deleteAllByUserId(userId: string): Promise<any> {
    return RefreshToken.deleteMany({ user: userId });
  }
}
export const refreshTokenRepository = new RefreshTokenRepository();
