import { describe, it, expect, beforeEach, vi } from 'vitest';
import app from '../src/index';

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
    _store: store,
    _clear: () => store.clear(),
  };
};

const mockKV = createMockKV();

// Bind mock KV to app via env
const testApp = {
  request: (path: string, init?: RequestInit) => {
    const req = new Request(`http://localhost${path}`, init);
    return app.fetch(req, { DOLD: mockKV as any });
  },
};

describe('Encrypt/Decrypt API', () => {
  beforeEach(() => {
    mockKV._clear();
    vi.clearAllMocks();
  });

  describe('POST /api/encrypt', () => {
    it('should encrypt a message successfully', async () => {
      const message = 'Hello, World!';
      const response = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      expect(response.status).toBe(200);

      const data: { id: string } = await response.json();
      expect(data).toHaveProperty('id');
      expect(typeof data.id).toBe('string');
      expect(data.id.length).toBe(32);

      // Only one KV write (ciphertext only, no key stored)
      expect(mockKV.put).toHaveBeenCalledTimes(1);
    });

    it('should encrypt with custom expiration TTL', async () => {
      const message = 'Test message';
      const expirationTtl = 7200;

      const response = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, expirationTtl }),
      });

      expect(response.status).toBe(200);

      expect(mockKV.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { expirationTtl }
      );
    });

    it('should return 400 for empty message', async () => {
      const response = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing message', async () => {
      const response = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });

    it('should handle non-string message', async () => {
      const response = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 123 }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/decrypt', () => {
    it('should decrypt a message successfully', async () => {
      const originalMessage = 'Hello, World!';

      const encryptResponse = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id }: { id: string } = await encryptResponse.json();

      const decryptResponse = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData).toHaveProperty('message');
      expect(decryptedData.message).toBe(originalMessage);

      expect(mockKV.delete).toHaveBeenCalledWith(id);
      expect(mockKV.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters and unicode', async () => {
      const originalMessage = 'Hello! Special chars: áéíóú, 中文, русский';

      const encryptResponse = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id }: { id: string } = await encryptResponse.json();

      const decryptResponse = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData.message).toBe(originalMessage);
    });

    it('should handle long messages', async () => {
      const originalMessage = 'A'.repeat(5000);

      const encryptResponse = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id }: { id: string } = await encryptResponse.json();

      const decryptResponse = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData.message).toBe(originalMessage);
    });

    it('should return 404 for non-existent secret', async () => {
      const response = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'nonexistent_id_that_does_not_exist',
        }),
      });

      expect(response.status).toBe(404);

      const data: { error: string } = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Secret not found or has expired');
    });

    it('should return 400 for invalid id length', async () => {
      const response = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'short',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing fields', async () => {
      const response = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should delete data after successful decryption (one-time use)', async () => {
      const originalMessage = 'One-time secret';

      const encryptResponse = await testApp.request('/api/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: originalMessage }),
      });

      const { id }: { id: string } = await encryptResponse.json();

      // First decryption should work
      const firstDecryptResponse = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      expect(firstDecryptResponse.status).toBe(200);

      // Second decryption should fail (data deleted)
      const secondDecryptResponse = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      expect(secondDecryptResponse.status).toBe(404);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle corrupted stored data', async () => {
      const id = 'corrupted_data_id_padded_to_32chr';

      await mockKV.put(id, 'corrupted-json');

      const response = await testApp.request('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      expect(response.status).toBe(500);

      const data: { error: string } = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe(
        'Decryption failed. The secret may have been tampered with or is invalid.'
      );
    });
  });
});
