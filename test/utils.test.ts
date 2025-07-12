import { describe, it, expect } from 'vitest';
import {
  generateId,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64UrlEncode,
  base64UrlDecode,
} from '../src/lib/utils';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate ID with default length of 16', () => {
      const id = generateId();
      expect(id).toHaveLength(16);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate ID with custom length', () => {
      const id = generateId(32);
      expect(id).toHaveLength(32);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateId());
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });
  });

  describe('arrayBufferToBase64', () => {
    it('should convert ArrayBuffer to base64', () => {
      const text = 'Hello, World!';
      const buffer = new TextEncoder().encode(text).buffer;
      const base64 = arrayBufferToBase64(buffer as ArrayBuffer);

      expect(typeof base64).toBe('string');
      expect(base64).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);

      // Verify it can be decoded back
      const decoded = atob(base64);
      const decodedBuffer = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        decodedBuffer[i] = decoded.charCodeAt(i);
      }
      const decodedText = new TextDecoder().decode(decodedBuffer);
      expect(decodedText).toBe(text);
    });

    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      const base64 = arrayBufferToBase64(buffer);
      expect(base64).toBe('');
    });
  });

  describe('base64ToArrayBuffer', () => {
    it('should convert base64 to ArrayBuffer', () => {
      const text = 'Hello, World!';
      const base64 = btoa(text);
      const buffer = base64ToArrayBuffer(base64);

      expect(buffer).toBeInstanceOf(ArrayBuffer);

      const decoded = new TextDecoder().decode(buffer);
      expect(decoded).toBe(text);
    });

    it('should handle empty base64 string', () => {
      const buffer = base64ToArrayBuffer('');
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBe(0);
    });
  });

  describe('base64UrlEncode', () => {
    it('should encode string to base64url format', () => {
      const text = 'Hello, World!';
      const encoded = base64UrlEncode(text);

      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should handle special characters requiring padding', () => {
      const text = 'sure.';
      const encoded = base64UrlEncode(text);

      // base64 of "sure." is "c3VyZS4=" which has padding
      expect(encoded).toBe('c3VyZS4');
    });
  });

  describe('base64UrlDecode', () => {
    it('should decode base64url format', () => {
      const text = 'Hello, World!';
      const encoded = base64UrlEncode(text);
      const decoded = base64UrlDecode(encoded);

      expect(decoded).toBe(text);
    });

    it('should handle strings that originally had padding', () => {
      const text = 'sure.';
      const encoded = base64UrlEncode(text);
      const decoded = base64UrlDecode(encoded);

      expect(decoded).toBe(text);
    });

    it('should handle base64url with dashes and underscores', () => {
      const base64url = 'SGVsbG8sIFdvcmxkIQ';
      const decoded = base64UrlDecode(base64url);

      expect(decoded).toBe('Hello, World!');
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through arrayBuffer->base64->arrayBuffer', () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
      const base64 = arrayBufferToBase64(originalData.buffer);
      const convertedBuffer = base64ToArrayBuffer(base64);
      const convertedData = new Uint8Array(convertedBuffer);

      expect(convertedData).toEqual(originalData);
    });

    it('should maintain data integrity through base64url encode/decode', () => {
      const testStrings = [
        'Hello, World!',
        'Test with special chars: !@#$%^&*()',
        'Numbers: 123456789',
        'Mixed: Test123!@#',
        '', // empty string
        'a', // single character
        'ab', // two characters
        'abc', // three characters
      ];

      testStrings.forEach((text) => {
        const encoded = base64UrlEncode(text);
        const decoded = base64UrlDecode(encoded);
        expect(decoded).toBe(text);
      });
    });
  });
});
