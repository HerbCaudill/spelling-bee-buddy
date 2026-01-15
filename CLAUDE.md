# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spelling Bee Buddy is a companion web app for the NYT Spelling Bee puzzle. It provides AI-generated hints (via Anthropic API) and syncs user progress from their NYT account. The frontend is React/Vite deployed on Vercel; the backend is a Cloudflare Worker.

## Architecture

```
Frontend (React/Vite)  →  Cloudflare Worker  →  NYT APIs + Anthropic API
                          └─ KV for hint caching
```

- **Frontend** (`src/`): React 19, Tailwind CSS 4, shadcn/ui components
- **Worker** (`worker/`): Cloudflare Worker with Wrangler, handles CORS proxy and hint generation

### Key Data Flow

1. `/puzzle` - Worker fetches and parses NYT Spelling Bee page for game data
2. `/progress` - Worker proxies NYT Cubby API with user's auth token
3. `/hints` - Worker generates hints via Anthropic API, caches in KV (7-day TTL)

## Commands

```bash
# Development
pnpm dev              # Start worker, wait until ready, then start frontend
pnpm dev:app          # Start Vite dev server only (localhost:5173)
pnpm dev:worker       # Start Worker dev server only (localhost:8787)

# Testing
pnpm test             # Run Vitest unit tests in watch mode
pnpm test run         # Run unit tests once
pnpm test:worker      # Run Worker unit tests
pnpm test:pw          # Run Playwright E2E tests
pnpm test:pw:ui       # Run Playwright with UI
pnpm test:pw:headed   # Run Playwright in headed browser
pnpm test:all         # Full test suite (typecheck + unit + e2e)

# Building & Deployment
pnpm build            # TypeScript check + Vite build
pnpm worker:deploy    # Deploy Worker to Cloudflare

# Other
pnpm typecheck        # TypeScript check (frontend)
pnpm typecheck:worker # TypeScript check (worker)
pnpm format           # Format with Prettier
```

## Testing

- **Unit tests**: Vitest with jsdom, files named `*.test.ts(x)`
- **E2E tests**: Playwright (Chromium), tests in `e2e/` directory
- E2E tests use route interception to mock API responses

Run a single test file:

```bash
pnpm test src/lib/utils.test.ts
pnpm test:pw e2e/app.spec.ts
```

## Project Structure

```
src/
├── components/       # React components (each with co-located .test.tsx)
├── hooks/            # Custom hooks (usePuzzle, useUserProgress, useHints)
├── lib/              # Utilities (api.ts, storage.ts, utils.ts)
└── types/            # TypeScript interfaces

worker/src/
├── index.ts          # Main Worker handler (routes)
├── parser.ts         # NYT page parsing
├── hints.ts          # Anthropic API integration
└── cors.ts           # CORS utilities
```

## Development Credentials

Copy `.env.example` to `.env` and fill in:

- `VITE_NYT_TOKEN` - NYT-S cookie value from nytimes.com
- `VITE_NYT_SUBSCRIBER_ID` - Subscriber ID from Cubby API requests (found in browser dev tools network tab)
- `VITE_ANTHROPIC_KEY` - Anthropic API key for hint generation

These are automatically used in development mode so you don't need to enter them in the UI.

## Conventions

- Use `cx()` from `lib/utils.ts` for combining class names (wraps clsx + tailwind-merge)
- Components have a `Props` type defined at the end of the file
- Path alias: `@` maps to `./src`
