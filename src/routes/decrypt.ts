import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { decryptMessage, importKey } from '@/lib/crypto';
import { decryptSchema } from '@/lib/schemas';
import type { DoldApp, StoredCiphertext, StoredKey } from '@/types';

const app = new Hono<DoldApp>();

app.post('/', zValidator('json', decryptSchema), async (c) => {
  try {
    const { id } = c.req.valid('json');

    const [ciphertext, keyData] = await Promise.all([
      c.env.DOLD.get(id),
      c.env.DOLD.get(`doldKey:${id}`),
    ]);

    if (!ciphertext || !keyData) {
      return c.json({ error: 'Secret not found or has expired' }, 404);
    }

    const { encrypted, iv } = JSON.parse(ciphertext) as StoredCiphertext;
    const { key } = JSON.parse(keyData) as StoredKey;

    const cryptoKey = await importKey(key);
    const decryptedMessage = await decryptMessage(cryptoKey, encrypted, iv);

    await Promise.all([c.env.DOLD.delete(id), c.env.DOLD.delete(`doldKey:${id}`)]);

    return c.json({ message: decryptedMessage }, 200);
  } catch {
    return c.json(
      { error: 'Decryption failed. The secret may have been tampered with or is invalid.' },
      500
    );
  }
});

export default app;
