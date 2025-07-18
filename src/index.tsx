import { Hono } from 'hono';
import { renderer } from '@/renderer';
import { cors } from 'hono/cors';
import type { DoldApp } from '@/types';
import { z } from 'zod';
import {
  generateId,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  base64UrlDecode,
  base64UrlEncode,
  titleTemplate,
} from '@/lib/utils';
import { zValidator } from '@hono/zod-validator';

const app = new Hono<DoldApp>();

const encryptSchema = z
  .object({
    message: z.string().min(1, 'Message is required'),
    expirationTtl: z.number().min(300).optional().default(3600),
  })
  .strict();

const id = z.string().min(16, 'ID is required');
const doldKey = z.string().min(32, 'Dold Key is required');

const decryptSchema = z
  .object({
    id,
    doldKey,
  })
  .strict();

app.use('*', cors());

app.use(renderer);

app.get('/', (c) => {
  return c.render(<div id="root"></div>, {
    title: titleTemplate('Home'),
    description: 'Welcome to Dold, your secure message encryption service.',
  });
});

app.get(
  '/:id',
  zValidator('param', z.object({ id })),
  zValidator('query', z.object({ doldKey })),
  async (c) => {
    return c.render(<div id="root"></div>, {
      title: titleTemplate('Decrypt Message'),
      description: 'Decrypt your secure message with Dold.',
      clientScript: '/src/client/id.tsx',
    });
  }
);

const routes = app
  .post('/api/encrypt', zValidator('json', encryptSchema), async (c) => {
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
          iv,
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
  })
  .post('/api/decrypt', zValidator('json', decryptSchema), async (c) => {
    try {
      const { id, doldKey } = c.req.valid('json');

      const storedSecret = await c.env.DOLD.get(id);
      const storedKey = await c.env.DOLD.get(doldKey);

      if (!storedSecret || !storedKey) {
        return c.json({ error: 'Secret or key not found or has expired' }, 404);
      }

      const parsedJwk = JSON.parse(base64UrlDecode(storedKey));
      const { encrypted, iv } = JSON.parse(storedSecret);

      const key = await crypto.subtle.importKey(
        'jwk',
        parsedJwk,
        {
          name: 'AES-GCM',
        },
        true,
        ['decrypt']
      );

      const encryptedData = base64ToArrayBuffer(encrypted);
      const ivData = base64ToArrayBuffer(iv);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivData,
        },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      const decryptedMessage = decoder.decode(decrypted);

      await c.env.DOLD.delete(id);
      await c.env.DOLD.delete(doldKey);

      return c.json({ message: decryptedMessage });
    } catch (error) {
      return c.json(
        {
          error:
            'Decryption failed. The secret may have been tampered with or is invalid.',
        },
        500
      );
    }
  });

export type RouteType = typeof routes;

export default app;
