import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { generateId } from '@/lib/utils';
import { generateAesKey, encryptMessage, exportKey } from '@/lib/crypto';
import { encryptSchema } from '@/lib/schemas';
import type { DoldApp } from '@/types';

const app = new Hono<DoldApp>();

app.post('/', zValidator('json', encryptSchema), async (c) => {
  try {
    const { message, expirationTtl } = c.req.valid('json');

    const cryptoKey = await generateAesKey();
    const { encrypted, iv } = await encryptMessage(cryptoKey, message);
    const key = await exportKey(cryptoKey);

    const id = generateId(32);

    await Promise.all([
      c.env.DOLD.put(id, JSON.stringify({ encrypted, iv }), { expirationTtl }),
      c.env.DOLD.put(`doldKey:${id}`, JSON.stringify({ key }), { expirationTtl }),
    ]);

    return c.json({ id }, 200);
  } catch {
    return c.json({ error: 'Encryption failed' }, 500);
  }
});

export default app;
