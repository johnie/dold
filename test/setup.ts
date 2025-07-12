import { beforeAll } from 'vitest';

// Mock the crypto.subtle API for Node.js environment
beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    // Use Node.js crypto module if available
    try {
      const { webcrypto } = require('crypto');
      globalThis.crypto = webcrypto as any;
    } catch (error) {
      console.warn('crypto.subtle not available, some tests may fail');
    }
  }
});

// Mock btoa and atob for Node.js environment
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (str: string) => {
    try {
      return Buffer.from(str, 'binary').toString('base64');
    } catch (error) {
      throw new DOMException(
        'The string to be encoded contains invalid characters.',
        'InvalidCharacterError'
      );
    }
  };
}

if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (str: string) => {
    try {
      // Validate base64 string
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) {
        throw new DOMException(
          'The string to be decoded is not correctly encoded.',
          'InvalidCharacterError'
        );
      }
      return Buffer.from(str, 'base64').toString('binary');
    } catch (error) {
      if (error instanceof DOMException) {
        throw error;
      }
      throw new DOMException(
        'The string to be decoded is not correctly encoded.',
        'InvalidCharacterError'
      );
    }
  };
}
