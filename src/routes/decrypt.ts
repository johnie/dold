import { Hono } from 'hono';
import { z } from 'zod';
import { base64UrlDecode, base64ToArrayBuffer } from '../lib/utils';
import { zValidator } from '@hono/zod-validator';
import type { DoldApp } from '../types';

const router = new Hono<DoldApp>();

const decryptSchema = z
  .object({
    id: z.string().min(16, 'ID is required'),
    doldKey: z.string().min(32, 'Dold Key is required'),
  })
  .strict();

router.post('/', zValidator('json', decryptSchema), async (c) => {
  try {
    const { id, doldKey } = c.req.valid('json');

    const storedSecret = await c.env.DOLD.get(id);
    const storedKey = await c.env.DOLD.get(doldKey);

    if (!storedSecret || !storedKey) {
      return c.json({ error: 'Secret or key not found or has expired' }, 404);
    }

    const parsedJwk = JSON.parse(
      base64UrlDecode(storedKey.replace('dold:key:', ''))
    );
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
    console.error(error);
    return c.json(
      {
        error:
          'Decryption failed. The secret may have been tampered with or is invalid.',
      },
      500
    );
  }
});

export default router;
