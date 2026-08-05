import { RefreshToken } from '../models/RefreshToken.js';
export class RefreshTokenRepository {
    async create(token, userId, expiresAt) {
        const refreshToken = new RefreshToken({
            token,
            user: userId,
            expiresAt,
        });
        return refreshToken.save();
    }
    async findByToken(token) {
        return RefreshToken.findOne({ token }).populate('user');
    }
    async deleteByToken(token) {
        return RefreshToken.deleteOne({ token });
    }
    async deleteAllByUserId(userId) {
        return RefreshToken.deleteMany({ user: userId });
    }
}
export const refreshTokenRepository = new RefreshTokenRepository();
