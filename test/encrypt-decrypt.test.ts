import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import encryptRouter from '../src/routes/encrypt';
import decryptRouter from '../src/routes/decrypt';
import type { DoldApp } from '../src/types';

// Mock KV namespace
const createMockKV = () => {
  const store = new Map<string, { value: string; expiration?: number }>();

  return {
    get: vi.fn(async (key: string) => {
      const item = store.get(key);
      if (!item) return null;

      // Check if expired
      if (item.expiration && Date.now() > item.expiration) {
        store.delete(key);
        return null;
      }

      return item.value;
    }),
    put: vi.fn(
      async (
        key: string,
        value: string,
        options?: { expirationTtl?: number }
      ) => {
        const expiration = options?.expirationTtl
          ? Date.now() + options.expirationTtl * 1000
          : undefined;

        store.set(key, { value, expiration });
      }
    ),
    delete: vi.fn(async (key: string) => {
      const result = store.delete(key);
      return result;
    }),
    // For testing purposes, expose the internal store
    _store: store,
    _clear: () => store.clear(),
  };
};

// Create test app
const createTestApp = () => {
  const app = new Hono<DoldApp>();
  const mockKV = createMockKV();

  app.use('*', async (c, next) => {
    c.env = { DOLD: mockKV as any };
    await next();
  });

  app.route('/encrypt', encryptRouter);
  app.route('/decrypt', decryptRouter);

  return { app, mockKV };
};

describe('Encrypt/Decrypt API', () => {
  let app: Hono<DoldApp>;
  let mockKV: ReturnType<typeof createMockKV>;

  beforeEach(() => {
    const testApp = createTestApp();
    app = testApp.app;
    mockKV = testApp.mockKV;

    // Clear any existing data
    mockKV._clear();
  });

  describe('POST /encrypt', () => {
    it('should encrypt a message successfully', async () => {
      const message = 'Hello, World!';
      const response = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      expect(response.status).toBe(200);

      const data: { id: string; doldKey: string } = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('doldKey');
      expect(typeof data.id).toBe('string');
      expect(typeof data.doldKey).toBe('string');
      expect(data.id.length).toBe(16);
      expect(data.doldKey.length).toBe(32);

      // Verify data was stored in KV
      expect(mockKV.put).toHaveBeenCalledTimes(2);
    });

    it('should encrypt with custom expiration TTL', async () => {
      const message = 'Test message';
      const expirationTtl = 7200; // 2 hours

      const response = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, expirationTtl }),
      });

      expect(response.status).toBe(200);

      // Verify KV put was called with correct TTL
      expect(mockKV.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { expirationTtl }
      );
    });

    it('should return 400 for empty message', async () => {
      const response = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: '' }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing message', async () => {
      const response = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });

    it('should handle non-string message', async () => {
      const response = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 123 }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /decrypt', () => {
    it('should decrypt a message successfully', async () => {
      const originalMessage = 'Hello, World!';

      // First, encrypt the message
      const encryptResponse = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id, doldKey }: { id: string; doldKey: string } =
        await encryptResponse.json();

      // Then decrypt it
      const decryptResponse = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, doldKey }),
      });

      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData).toHaveProperty('message');
      expect(decryptedData.message).toBe(originalMessage);

      // Verify data was deleted from KV after decryption
      expect(mockKV.delete).toHaveBeenCalledWith(id);
      expect(mockKV.delete).toHaveBeenCalledWith(doldKey);
    });

    it('should handle special characters and unicode', async () => {
      const originalMessage = 'Hello 🌍! Special chars: áéíóú, 中文, русский';

      const encryptResponse = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id, doldKey }: { id: string; doldKey: string } =
        await encryptResponse.json();

      const decryptResponse = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, doldKey }),
      });

      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData.message).toBe(originalMessage);
    });

    it('should handle long messages', async () => {
      const originalMessage = 'A'.repeat(10000); // 10KB message

      const encryptResponse = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id, doldKey }: { id: string; doldKey: string } =
        await encryptResponse.json();

      const decryptResponse = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, doldKey }),
      });

      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData.message).toBe(originalMessage);
    });

    it('should return 404 for non-existent secret', async () => {
      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'nonexistent123456',
          doldKey: 'nonexistentkey1234567890123456789012',
        }),
      });

      expect(response.status).toBe(404);

      const data: { error: string } = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Secret or key not found or has expired');
    });

    it('should return 404 for missing secret but valid key', async () => {
      // Create a valid key but no secret
      const originalMessage = 'Test message';
      const encryptResponse = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { doldKey }: { doldKey: string } = await encryptResponse.json();

      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'nonexistent123456',
          doldKey,
        }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 404 for valid secret but missing key', async () => {
      // Create a valid secret but use wrong key
      const originalMessage = 'Test message';
      const encryptResponse = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id }: { id: string } = await encryptResponse.json();

      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          doldKey: 'nonexistentkey1234567890123456789012',
        }),
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid id length', async () => {
      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'short',
          doldKey: 'validkey1234567890123456789012345678',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid doldKey length', async () => {
      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 'validid123456789',
          doldKey: 'short',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing fields', async () => {
      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should delete data after successful decryption (one-time use)', async () => {
      const originalMessage = 'One-time secret';

      // Encrypt
      const encryptResponse = await app.request('/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id, doldKey }: { id: string; doldKey: string } =
        await encryptResponse.json();

      // First decryption should work
      const firstDecryptResponse = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, doldKey }),
      });

      expect(firstDecryptResponse.status).toBe(200);

      // Second decryption should fail (data deleted)
      const secondDecryptResponse = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, doldKey }),
      });

      expect(secondDecryptResponse.status).toBe(404);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle corrupted stored data', async () => {
      // Manually store corrupted data
      const id = 'corrupted12345678';
      const doldKey = 'corruptedkey12345678901234567890';

      await mockKV.put(id, 'corrupted-json');
      await mockKV.put(doldKey, 'corrupted-key');

      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, doldKey }),
      });

      expect(response.status).toBe(500);

      const data: { error: string } = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe(
        'Decryption failed. The secret may have been tampered with or is invalid.'
      );
    });

    it('should handle invalid base64 in stored data', async () => {
      const id = 'invalid123456789';
      const doldKey = 'invalidkey123456789012345678901234';

      // Store valid JSON but invalid base64
      await mockKV.put(
        id,
        JSON.stringify({
          encrypted: 'invalid-base64!!!',
          iv: 'invalid-base64!!!',
        })
      );

      // Create a valid base64 string but with invalid JWK content
      const invalidJwk = btoa('{"invalid":"jwk"}');
      await mockKV.put(
        doldKey,
        invalidJwk.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      );

      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, doldKey }),
      });

      expect(response.status).toBe(500);
    });

    it('should handle invalid JWK data', async () => {
      const id = 'invalidjwk123456789';
      const doldKey = 'invalidjwkkey123456789012345678901';

      // Store valid encrypted data structure
      await mockKV.put(
        id,
        JSON.stringify({
          encrypted: btoa('valid-encrypted-data'),
          iv: btoa('valid-iv-data'),
        })
      );

      // Store invalid JWK (valid base64 but not a proper JWK)
      const invalidJwk = btoa('{"not":"a","valid":"jwk"}');
      await mockKV.put(
        doldKey,
        invalidJwk.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      );

      const response = await app.request('/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, doldKey }),
      });

      expect(response.status).toBe(500);
    });
  });
});
