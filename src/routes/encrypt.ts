import { Hono } from 'hono';
import { z } from 'zod';
import { generateId, arrayBufferToBase64, base64UrlEncode } from '@/lib/utils';
import { zValidator } from '@hono/zod-validator';
import type { DoldApp } from '@/types';

const router = new Hono<DoldApp>();

const encryptSchema = z
  .object({
    message: z.string().min(1, 'Message is required'),
    expirationTtl: z.number().min(300).optional().default(3600),
  })
  .strict();

router.post('/', zValidator('json', encryptSchema), async (c) => {
  try {
    const { message, expirationTtl } = c.req.valid('json');

    const key = (await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )) as CryptoKey;

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedMessage
    );

    const jwk = await crypto.subtle.exportKey('jwk', key);
    const exportedKey = base64UrlEncode(JSON.stringify(jwk));

    const doldKey = generateId(32);
    const id = generateId();

    await c.env.DOLD.put(
      id,
      JSON.stringify({
        encrypted: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv.buffer),
      }),
      { expirationTtl }
    );

    await c.env.DOLD.put(doldKey, exportedKey, {
      expirationTtl,
    });

    return c.json({ id, doldKey });
  } catch (error) {
    return c.json({ error: 'Encryption failed' }, 500);
  }
});

export default router;
