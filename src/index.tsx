import { Hono } from 'hono';
import { renderer } from '@/renderer';
import { cors } from 'hono/cors';
import type { DoldApp } from '@/types';
import { z } from 'zod';
import {
  generateId,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  titleTemplate,
} from '@/lib/utils';
import { zValidator } from '@hono/zod-validator';

const app = new Hono<DoldApp>();

app.use('*', cors());

app.use(renderer);

const renderShell = (c: any) => {
  return c.render(<div id="root"></div>, {
    title: titleTemplate('Home'),
    description: 'Welcome to Dold, your secure message encryption service.',
  });
};

app.get('/', renderShell);
app.get('/m/:id', renderShell);

const encryptSchema = z
  .object({
    message: z.string().min(1, 'Message is required'),
    expirationTtl: z.number().min(300).optional().default(3600),
  })
  .strict();

const decryptSchema = z
  .object({
    id: z.string().min(8, 'ID is required'),
  })
  .strict();

const routes = app
  .post('/api/encrypt', zValidator('json', encryptSchema), async (c) => {
    try {
      const { message, expirationTtl } = c.req.valid('json');

      const cryptoKey = (await crypto.subtle.generateKey(
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
        cryptoKey,
        encodedMessage
      );

      const jwk = await crypto.subtle.exportKey('jwk', cryptoKey);

      const id = generateId(8);

      await c.env.DOLD.put(
        id,
        JSON.stringify({
          encrypted: arrayBufferToBase64(encrypted),
          iv: arrayBufferToBase64(iv.buffer),
          key: jwk,
        }),
        { expirationTtl }
      );

      return c.json({ id });
    } catch (error) {
      return c.json({ error: 'Encryption failed' }, 500);
    }
  })
  .post('/api/decrypt', zValidator('json', decryptSchema), async (c) => {
    try {
      const { id } = c.req.valid('json');

      const storedSecret = await c.env.DOLD.get(id);

      if (!storedSecret) {
        return c.json(
          { error: 'Secret not found or has expired' },
          404
        );
      }

      const { encrypted, iv, key } = JSON.parse(storedSecret);

      const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        key,
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
        cryptoKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      const decryptedMessage = decoder.decode(decrypted);

      await c.env.DOLD.delete(id);

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
