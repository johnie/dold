import { z } from 'zod';

export const TTL_OPTIONS = [
  { label: '5 minutes', value: 300 },
  { label: '1 hour', value: 3600 },
  { label: '24 hours', value: 86400 },
  { label: '7 days', value: 604800 },
] as const;

export const encryptSchema = z
  .object({
    message: z.string().min(1, 'Message is required').max(5000),
    expirationTtl: z.number().min(300).optional().default(3600),
  })
  .strict();

export const decryptSchema = z
  .object({
    id: z.string().min(32, 'ID is required'),
  })
  .strict();

export type EncryptInput = z.infer<typeof encryptSchema>;
export type DecryptInput = z.infer<typeof decryptSchema>;
