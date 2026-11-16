import { Request, Response, NextFunction } from 'express';

export type CookiesRequest = Request & {
  cookies?: Record<string, string>;
};

export const parseCookieHeader = (header?: string): Record<string, string> => {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  const pairs = header.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }
  return cookies;
};

export const parseCookies = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.cookie;
  (req as CookiesRequest).cookies = parseCookieHeader(header);
  next();
};

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const getRefreshCookieOptions = (days: number = 7) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: days * 24 * 60 * 60 * 1000,
});
