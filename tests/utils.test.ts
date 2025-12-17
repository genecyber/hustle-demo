import { describe, it, expect } from 'vitest';
import {
  truncateAddress,
  generateId,
  decodeJwtPayload,
  isJwtExpired,
  formatFileSize,
} from '../src/utils';

describe('Utils', () => {
  describe('truncateAddress', () => {
    it('truncates a long address', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(truncateAddress(address)).toBe('0x1234...5678');
    });

    it('returns short addresses unchanged', () => {
      expect(truncateAddress('0x1234')).toBe('0x1234');
    });

    it('handles empty string', () => {
      expect(truncateAddress('')).toBe('');
    });

    it('allows custom start/end chars', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(truncateAddress(address, 4, 2)).toBe('0x12...78');
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('uses custom prefix', () => {
      const id = generateId('msg');
      expect(id.startsWith('msg-')).toBe(true);
    });
  });

  describe('decodeJwtPayload', () => {
    it('decodes valid JWT', () => {
      // JWT with payload: { "sub": "1234", "exp": 9999999999 }
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0IiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
      const payload = decodeJwtPayload(token);
      expect(payload).toEqual({ sub: '1234', exp: 9999999999 });
    });

    it('returns null for invalid JWT', () => {
      expect(decodeJwtPayload('invalid')).toBe(null);
      expect(decodeJwtPayload('a.b')).toBe(null);
      expect(decodeJwtPayload('')).toBe(null);
    });
  });

  describe('isJwtExpired', () => {
    it('returns true for expired token', () => {
      // exp: 1 (1970)
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjF9.sig';
      expect(isJwtExpired(token)).toBe(true);
    });

    it('returns false for valid token', () => {
      // exp: 9999999999 (far future)
      const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.sig';
      expect(isJwtExpired(token)).toBe(false);
    });

    it('returns true for invalid token', () => {
      expect(isJwtExpired('invalid')).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
    });
  });
});
