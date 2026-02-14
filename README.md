# Dold

Dold is a one-time secret sharing service. Encrypt a message, get a link, share it -- the message is permanently deleted after being read once. Built with [Hono](https://hono.dev) and [React](https://react.dev), deployed on [Cloudflare Workers](https://workers.cloudflare.com) with KV storage.

> **dold** -- Swedish for *hidden*.

## How it works

1. A user submits a plaintext message through the web interface.
2. The server generates a **256-bit AES-GCM** key and encrypts the message.
3. The ciphertext, IV, and exported key (JWK) are stored together in Cloudflare KV under a random 8-character ID with a configurable TTL (5 minutes to 7 days).
4. The user receives a shareable link containing the ID.
5. When the recipient opens the link and clicks **Reveal**, the server decrypts the message and **immediately deletes** the KV entry.
6. Any subsequent attempt to access the same link returns a 404.

## Tech stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Runtime     | Cloudflare Workers                            |
| Backend     | Hono                                          |
| Frontend    | React 19 with SSR via `@hono/react-renderer`  |
| Storage     | Cloudflare KV                                 |
| Validation  | Zod (strict schemas via `@hono/zod-validator`) |
| Styling     | Tailwind CSS 4, shadcn/ui, `cva`              |
| Build       | Vite with `@cloudflare/vite-plugin`           |
| Testing     | Vitest                                        |

## Project structure

```
src/
  index.tsx              Server entry point, API routes, Hono app
  renderer.tsx           SSR HTML shell with Vite integration
  client/
    index.tsx            Client-side hydration entry
    app.tsx              Root React component with routing
  components/
    dold-form.tsx        Encrypt form (message input, TTL selector, share URL)
    decrypt-view.tsx     Decrypt view (reveal, display, copy)
    logo.tsx             Application logo
    ui/                  shadcn/ui primitives (button, card, input, etc.)
  lib/
    utils.ts             Crypto helpers, base64 encoding, class utilities
  types/
    index.ts             DoldApp bindings type, Meta type
  contants/
    index.ts             Application constants
test/
  encrypt-decrypt.test.ts  Full encrypt/decrypt round-trip tests
  utils.test.ts            Unit tests for utility functions
```

## API

### `POST /api/encrypt`

Encrypts a message and stores it in KV.

**Request body:**

```json
{
  "message": "your secret message",
  "expirationTtl": 3600
}
```

- `message` (string, required) -- the plaintext to encrypt.
- `expirationTtl` (number, optional) -- time-to-live in seconds. Minimum 300, default 3600.

**Response:**

```json
{ "id": "aB3xK9mQ" }
```

### `POST /api/decrypt`

Decrypts and permanently deletes a stored message.

**Request body:**

```json
{
  "id": "aB3xK9mQ"
}
```

- `id` (string, required) -- minimum 8 characters.

**Response:**

```json
{ "message": "your secret message" }
```

Returns `404` if the message has already been read or has expired. Returns `500` if the stored data is corrupted or tampered with.

## Getting started

### Prerequisites

- Node.js >= 20
- pnpm
- A Cloudflare account (for deployment)

### Install and run

```bash
pnpm install
pnpm dev
```

This starts the Vite dev server with hot reload and Cloudflare Workers emulation.

### Available scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run test suite
pnpm preview      # Build and preview locally
pnpm deploy       # Build and deploy to Cloudflare Workers
pnpm cf-typegen   # Generate TypeScript types for Cloudflare bindings
```

### Cloudflare KV setup

The app requires a KV namespace bound as `DOLD`. To create one:

```bash
npx wrangler kv namespace create DOLD
```

Update the `id` in `wrangler.jsonc` with the returned namespace ID.

## License

MIT
