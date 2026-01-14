# Spelling Bee Buddy

A companion web app for the NYT Spelling Bee puzzle that provides AI-generated hints and syncs your progress.

## Features

- View today's puzzle letters and your current rank
- Track found words synced from your NYT account
- Get AI-generated hints grouped by starting letters
- Works offline (PWA)

## Setup

```bash
pnpm install
pnpm dev:all
```

This starts the frontend at `localhost:5173` and the worker API at `localhost:8787`.

## Configuration

The app requires two credentials (entered via the settings modal):

- **NYT-S token**: Your NYT session cookie for syncing progress
- **Anthropic API key**: For generating hints

## Tech stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Cloudflare Worker with KV caching
