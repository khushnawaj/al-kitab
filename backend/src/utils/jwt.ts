import jwt from 'jsonwebtoken';

const getAccessSecret = (): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: ACCESS_TOKEN_SECRET environment variable is required in production mode');
    }
    return 'al_kitab_dev_access_fallback_secret_key_32chars';
  }
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: REFRESH_TOKEN_SECRET environment variable is required in production mode');
    }
    return 'al_kitab_dev_refresh_fallback_secret_key_32chars';
  }
  return secret;
};

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, getAccessSecret(), { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string, expiresInDays: number = 7): string => {
  return jwt.sign({ userId }, getRefreshSecret(), { expiresIn: `${expiresInDays}d` });
};

export const verifyAccessToken = (token: string): { userId: string } => {
  return jwt.verify(token, getAccessSecret()) as { userId: string };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, getRefreshSecret()) as { userId: string };
};
