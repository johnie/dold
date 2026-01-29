# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dold is a secure message encryption service that provides end-to-end message encryption with temporary storage. Built with Hono (backend) and React (frontend), deployed on Cloudflare Workers with KV storage.

## Commands

```bash
pnpm dev          # Start Vite dev server with hot reload
pnpm build        # Build for production
pnpm test         # Run Vitest test suite
pnpm preview      # Build and preview production build locally
pnpm deploy       # Build and deploy to Cloudflare Workers
pnpm cf-typegen   # Generate TypeScript types for Cloudflare bindings
```

## Architecture

### Stack
- **Backend**: Hono framework on Cloudflare Workers
- **Frontend**: React 19 with SSR via `@hono/react-renderer`
- **Storage**: Cloudflare KV Namespace (binding: `DOLD`)
- **Validation**: Zod schemas with `@hono/zod-validator`
- **Styling**: Tailwind CSS 4 with shadcn/ui components

### Source Structure
- `src/index.tsx` - Hono server entry point, configures CORS and routes
- `src/client/` - Client-side React app (hydrates server-rendered HTML)
- `src/routes/` - API route handlers (`encrypt.ts`, `decrypt.ts`)
- `src/components/` - React components, `ui/` contains shadcn/ui components
- `src/lib/utils.ts` - Crypto utilities (base64, ID generation, etc.)
- `src/types/` - TypeScript type definitions including `DoldApp` bindings

### Encryption Flow
1. **Encrypt** (`POST /api/encrypt`): Generates AES-GCM 256-bit key, encrypts message, stores ciphertext and key separately in KV with TTL
2. **Decrypt** (`POST /api/decrypt`): Retrieves and decrypts message, then deletes both KV entries (one-time access)

Key security pattern: Encryption key and ciphertext are stored with different KV keys (`id` and `doldKey`) to prevent exposure if one is compromised.

### Type System
The `DoldApp` type in `src/types/index.ts` defines Cloudflare bindings. All routes use Zod schemas with `.strict()` to reject extra fields.

## Conventions

- Path alias: `@/*` maps to `./src/*`
- UI components use shadcn/ui patterns with `class-variance-authority`
- CSS uses OKLCH color space with CSS custom properties for theming
- Routes return JSON with appropriate HTTP status codes (200, 404, 500)
