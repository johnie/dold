import { describe, it, expect, beforeEach, vi } from "vitest";

import app from "../src/index";

const createMockKV = () => {
  const store = new Map<string, { expiration?: number; value: string }>();

  return {
    _clear: () => store.clear(),
    _store: store,
    delete: vi.fn<(key: string) => Promise<boolean>>((key: string) => {
      const result = store.delete(key);
      return Promise.resolve(result);
    }),
    get: vi.fn<(key: string) => Promise<string | null>>((key: string) => {
      const item = store.get(key);
      if (!item) {
        return Promise.resolve(null);
      }

      if (item.expiration && Date.now() > item.expiration) {
        store.delete(key);
        return Promise.resolve(null);
      }

      return Promise.resolve(item.value);
    }),
    getWithMetadata: vi.fn<() => Promise<null>>(),
    list: vi.fn<() => Promise<{ keys: []; list_complete: boolean }>>(),
    put: vi.fn<
      (
        key: string,
        value: string,
        options?: { expirationTtl?: number }
      ) => Promise<void>
    >((key: string, value: string, options?: { expirationTtl?: number }) => {
      const expiration = options?.expirationTtl
        ? Date.now() + options.expirationTtl * 1000
        : undefined;

      store.set(key, { expiration, value });
      return Promise.resolve();
    }),
  };
};

const mockKV = createMockKV();

const testApp = {
  request: (path: string, init?: RequestInit) => {
    const req = new Request(`http://localhost${path}`, init);
    // SAFETY: mockKV fulfills KVNamespace operations needed for test request handling.
    return app.fetch(req, { DOLD: mockKV as KVNamespace });
  },
};

describe("Encrypt/Decrypt API", () => {
  beforeEach(() => {
    mockKV._clear();
    vi.clearAllMocks();
  });

  describe("POST /api/encrypt", () => {
    it("should encrypt a message successfully", async () => {
      const message = "Hello, World!";
      const response = await testApp.request("/api/encrypt", {
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      expect(response.status).toBe(200);

      const data: { id: string } = await response.json();
      expect(data).toHaveProperty("id");
      expect(data.id).toBeTypeOf("string");
      expect(data.id).toHaveLength(32);
      expect(mockKV.put).toHaveBeenCalledTimes(2);
    });

    it("should encrypt with custom expiration TTL", async () => {
      const message = "Test message";
      const expirationTtl = 7200;

      const response = await testApp.request("/api/encrypt", {
        body: JSON.stringify({ expirationTtl, message }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(response.status).toBe(200);

      expect(mockKV.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { expirationTtl }
      );
    });

    it("should return 400 for empty message", async () => {
      const response = await testApp.request("/api/encrypt", {
        body: JSON.stringify({ message: "" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(response.status).toBe(400);
    });

    it("should return 400 for missing message", async () => {
      const response = await testApp.request("/api/encrypt", {
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid JSON", async () => {
      const response = await testApp.request("/api/encrypt", {
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(response.status).toBe(400);
    });

    it("should handle non-string message", async () => {
      const response = await testApp.request("/api/encrypt", {
        body: JSON.stringify({ message: 123 }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/decrypt", () => {
    it("should decrypt a message successfully", async () => {
      const originalMessage = "Hello, World!";

      const encryptResponse = await testApp.request("/api/encrypt", {
        body: JSON.stringify({ message: originalMessage }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const { id }: { id: string } = await encryptResponse.json();

      const decryptResponse = await testApp.request("/api/decrypt", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData.message).toBe(originalMessage);

      expect(mockKV.delete).toHaveBeenCalledWith(id);
      expect(mockKV.delete).toHaveBeenCalledWith(`doldKey:${id}`);
      expect(mockKV.delete).toHaveBeenCalledTimes(2);
    });

    it("should handle special characters and unicode", async () => {
      const originalMessage = "Hello! Special chars: áéíóú, 中文, русский";

      const encryptResponse = await testApp.request("/api/encrypt", {
        body: JSON.stringify({ message: originalMessage }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const { id }: { id: string } = await encryptResponse.json();

      const decryptResponse = await testApp.request("/api/decrypt", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData.message).toBe(originalMessage);
    });

    it("should handle long messages", async () => {
      const originalMessage = "A".repeat(5000);

      const encryptResponse = await testApp.request("/api/encrypt", {
        body: JSON.stringify({ message: originalMessage }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const { id }: { id: string } = await encryptResponse.json();

      const decryptResponse = await testApp.request("/api/decrypt", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(decryptResponse.status).toBe(200);

      const decryptedData: { message: string } = await decryptResponse.json();
      expect(decryptedData.message).toBe(originalMessage);
    });

    it("should return 404 for non-existent secret", async () => {
      const response = await testApp.request("/api/decrypt", {
        body: JSON.stringify({
          id: "nonexistent_id_that_does_not_exist",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      expect(response.status).toBe(404);

      const data: { error: string } = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Secret not found or has expired");
    });

    it("should return 400 for invalid id length", async () => {
      const response = await testApp.request("/api/decrypt", {
        body: JSON.stringify({
          id: "short",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing fields", async () => {
      const response = await testApp.request("/api/decrypt", {
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(response.status).toBe(400);
    });

    it("should delete data after successful decryption (one-time use)", async () => {
      const originalMessage = "One-time secret";

      const encryptResponse = await testApp.request("/api/encrypt", {
        body: JSON.stringify({ message: originalMessage }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const { id }: { id: string } = await encryptResponse.json();

      const firstDecryptResponse = await testApp.request("/api/decrypt", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      expect(firstDecryptResponse.status).toBe(200);

      const secondDecryptResponse = await testApp.request("/api/decrypt", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(secondDecryptResponse.status).toBe(404);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle corrupted stored data", async () => {
      const id = "corrupted_data_id_padded_to_32chr";

      await mockKV.put(id, "corrupted-json");
      await mockKV.put(`doldKey:${id}`, "corrupted-key");

      const response = await testApp.request("/api/decrypt", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(response.status).toBe(500);

      const data: { error: string } = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe(
        "Decryption failed. The secret may have been tampered with or is invalid."
      );
    });
  });
});
