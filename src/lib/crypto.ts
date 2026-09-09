import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils";

export const generateAesKey = (): Promise<CryptoKey> =>
  crypto.subtle.generateKey({ length: 256, name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);

export const encryptMessage = async (
  key: CryptoKey,
  plaintext: string
): Promise<{ encrypted: string; iv: string }> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encoded = encoder.encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { iv, name: "AES-GCM" },
    key,
    encoded
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
  };
};

export const decryptMessage = async (
  key: CryptoKey,
  encrypted: string,
  iv: string
): Promise<string> => {
  const encryptedData = base64ToArrayBuffer(encrypted);
  const ivData = base64ToArrayBuffer(iv);
  const decrypted = await crypto.subtle.decrypt(
    { iv: ivData, name: "AES-GCM" },
    key,
    encryptedData
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

export const exportKey = (key: CryptoKey): Promise<JsonWebKey> =>
  crypto.subtle.exportKey("jwk", key);

export const importKey = (jwk: JsonWebKey): Promise<CryptoKey> =>
  crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, ["decrypt"]);
