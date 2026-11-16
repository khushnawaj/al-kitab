import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from '../utils/jwt.js';
import { parseCookieHeader } from '../middlewares/cookieParser.js';
import { sanitizeMongoUri } from '../config/db.js';
import { formatUserResponse } from '../services/AuthService.js';

describe('Auth Utilities & Security', () => {
  describe('JWT token handling', () => {
    it('generates and verifies valid access tokens', () => {
      const userId = '64e320fbfbc76a1234567890';
      const token = generateAccessToken(userId);
      const decoded = verifyAccessToken(token);

      assert.equal(decoded.userId, userId);
    });

    it('generates and verifies valid refresh tokens', () => {
      const userId = '64e320fbfbc76a1234567890';
      const token = generateRefreshToken(userId, 7);
      const decoded = verifyRefreshToken(token);

      assert.equal(decoded.userId, userId);
    });

    it('rejects tampered tokens', () => {
      const userId = '64e320fbfbc76a1234567890';
      const token = generateAccessToken(userId);
      const tampered = token.slice(0, -5) + 'xxxxx';

      assert.throws(() => {
        verifyAccessToken(tampered);
      });
    });
  });

  describe('Cookie parser', () => {
    it('parses valid cookie strings with URL encoded values', () => {
      const header = 'refreshToken=eyJhbGciOiJIUzI1NiJ9; session=active%20state; theme=dark';
      const parsed = parseCookieHeader(header);

      assert.equal(parsed.refreshToken, 'eyJhbGciOiJIUzI1NiJ9');
      assert.equal(parsed.session, 'active state');
      assert.equal(parsed.theme, 'dark');
    });

    it('handles empty or missing cookie headers gracefully', () => {
      assert.deepEqual(parseCookieHeader(undefined), {});
      assert.deepEqual(parseCookieHeader(''), {});
    });
  });

  describe('Secret & log sanitization', () => {
    it('masks credentials in MongoDB connection URIs', () => {
      const uriWithAuth = 'mongodb://app_user:SuperSecretPassword123@cluster0.mongodb.net:27017/al_kitab?retryWrites=true';
      const sanitized = sanitizeMongoUri(uriWithAuth);

      assert.equal(sanitized.includes('SuperSecretPassword123'), false);
      assert.equal(sanitized.includes('app_user'), false);
      assert.equal(sanitized.includes('//***:***@cluster0.mongodb.net'), true);
    });

    it('leaves local non-credential URIs readable', () => {
      const local = 'mongodb://127.0.0.1:27017/al_kitab';
      assert.equal(sanitizeMongoUri(local), local);
    });
  });

  describe('formatUserResponse', () => {
    it('formats user object consistently without passwordHash', () => {
      const rawUser = {
        _id: 'user123',
        name: 'Bilal',
        email: 'bilal@example.com',
        passwordHash: '$2a$10$hashedstring',
        role: 'user',
        theme: 'dark',
        language: 'ur',
      };

      const formatted = formatUserResponse(rawUser);
      assert.equal(formatted.id, 'user123');
      assert.equal(formatted.name, 'Bilal');
      assert.equal(formatted.email, 'bilal@example.com');
      assert.equal('passwordHash' in formatted, false);
      assert.equal(formatted.theme, 'dark');
      assert.equal(formatted.language, 'ur');
    });
  });
});
