# Spelling Bee Buddy - Technical Specification

## Overview

A personal Spelling Bee hints app that replicates the functionality of the [NYT Spelling Bee Buddy](https://www.nytimes.com/interactive/2023/upshot/spelling-bee-buddy.html), but uses AI-generated hints instead of manually-gathered forum hints.

## Features

### Core Features

1. **Puzzle Display**
   - Show today's letters (center + outer)
   - Date picker for past puzzles
   - Links to play Spelling Bee and visit the forum

2. **Progress Tracking**
   - Display words found and points earned
   - Progress bar toward Queen Bee
   - Sync with NYT account (via token)

3. **AI-Generated Hints** (Steve G style)
   - Grouped by two-letter prefix (AL, BA, BE, etc.)
   - Format: `Clue text (word length)`
   - Example: `Soda + liquor premix (7)` for ALCOPOP
   - Hints cached per puzzle to avoid regeneration

4. **Grid of Remaining Words**
   - Rows: First letter (A, B, C, etc.)
   - Columns: Word length (4, 5, 6, etc.)
   - Cells show count of remaining words
   - Checkmarks for completed rows/columns

5. **Two-Letter List**
   - Show remaining words grouped by first two letters
   - Example: AL: 3, BA: 1, BE: 1, etc.

6. **You vs. Others Statistics**
   - Show which words other players found
   - Percentage of players who found each word
   - Data from NYT API (aggregated stats)

### Authentication

- **Current approach**: Hard-coded NYT-S token (like xword-stats)
- **Future**: TODO - investigate better auth flow options
  - Browser extension that reads cookies
  - Bookmarklet
  - OAuth (if NYT ever supports it)

### Hint Generation

- User provides their own Anthropic API key
- Key stored in browser localStorage
- Hints generated on first request for each puzzle
- Cached in Cloudflare KV (keyed by puzzle date)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│                   React + Vite + Tailwind                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Worker                          │
│  - Proxy NYT API calls (add auth header)                    │
│  - Generate hints via Anthropic API                         │
│  - Cache hints in KV                                        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  NYT API │   │ Anthropic│   │Cloudflare│
        │          │   │   API    │   │    KV    │
        └──────────┘   └──────────┘   └──────────┘
```

### Why Cloudflare Worker?

- Minimal infrastructure to maintain
- Handles CORS for NYT API calls
- Serverless - no server to manage
- KV storage for hint caching
- Free tier is generous

## NYT API Details

### Puzzle Data

The puzzle data is **embedded in the game page HTML**, not fetched from a separate API.

**Source**: `https://www.nytimes.com/puzzles/spelling-bee`

The page contains a `window.gameData` object (accessible via `window.__NEXT_DATA__` or similar):

```typescript
interface GameData {
  today: {
    displayWeekday: string       // "Wednesday"
    displayDate: string          // "January 14, 2026"
    printDate: string            // "2026-01-14"
    centerLetter: string         // "o"
    outerLetters: string[]       // ["a", "b", "c", "e", "l", "p"]
    validLetters: string[]       // ["o", "a", "b", "c", "e", "l", "p"]
    pangrams: string[]           // ["placebo"]
    answers: string[]            // All valid words (56 in this example)
    id: number                   // Puzzle ID (e.g., 20035)
  }
}
```

**Extraction method**: Fetch the page HTML and execute JavaScript to extract `window.gameData`, or parse the JSON from embedded script tags.

### User's Found Words (for current puzzle)

**Endpoint**: `GET https://www.nytimes.com/svc/int/run/cubby/public-api/v1/responses/latest/spelling-bee-buddy/reader`

**Headers**: `Cookie: NYT-S={token}`

**Response**:
```typescript
interface CubbyResponse {
  response_id: string
  project_version: string      // Puzzle ID as string (e.g., "20035")
  correct: null
  content: {
    words: string[]            // Words the user has found
  }
}
```

This is how the official SBB page gets the user's progress for the current puzzle.

### User Overall Stats

**Endpoint**: `GET https://www.nytimes.com/svc/games/state/spelling_bee/latests`

**Headers**: `Cookie: NYT-S={token}`

**Response**:
```typescript
interface UserStats {
  user_id: number
  player: {
    stats: {
      spelling_bee: {
        puzzles_started: number
        total_words: number
        total_pangrams: number
        longest_word: {
          word: string
          center_letter: string
          print_date: string
        }
        ranks: {
          "Queen Bee": number
          "Genius": number
          "Amazing": number
          // etc.
        }
      }
    }
  }
}
```

### "You vs. Others" Statistics

The official SBB page shows what percentage of players found each word. Based on investigation:

- The page states "Based on a sample of 10,000 responses randomly chosen from all Bee Buddy visitors"
- Data appears to come from `samizdat-graphql.nytimes.com/graphql/v2` (GraphQL API)
- Introspection is disabled, so exact query structure is unknown
- The SBB page uses persisted queries with hashes

**MVP approach**: Skip this feature initially. Can be added later once the GraphQL query is reverse-engineered, or we can compute our own stats from cubby data if we cache responses.

### Updating User Progress

**Endpoint**: `PATCH https://www.nytimes.com/svc/int/run/cubby/public-api/v1/responses/modify`

The SBB page calls this to sync user's found words. Our app will be read-only (user plays on actual NYT site), so we don't need to call this.

## Hint Generation

### Prompt Template

```
You are generating Spelling Bee hints in the style of "Steve G" from the NYT Spelling Bee Forum.

Today's puzzle:
- Center letter: {centerLetter}
- All letters: {validLetters.join(', ')}
- Pangrams: {pangrams.join(', ')}

Generate hints for each word. Group hints by two-letter prefix.

Format:
{PREFIX}
{Hint 1} ({length})
{Hint 2} ({length})

Rules:
1. Hints should be clever wordplay, definitions, or cultural references
2. Never reveal more than the first two letters
3. Vary hint styles: puns, definitions, fill-in-the-blank, equations
4. For compound-style words, use "+" format (e.g., "Aluminum + cobalt + soda")

Words to hint:
{answers.join('\n')}
```

### Caching Strategy

- **Key format**: `hints:{printDate}` (e.g., `hints:2026-01-14`)
- **Value**: JSON object with hints grouped by two-letter prefix
- **TTL**: 30 days (puzzles are daily, old hints rarely needed)

```typescript
interface CachedHints {
  generatedAt: string
  hints: {
    [twoLetterPrefix: string]: Array<{
      hint: string
      length: number
    }>
  }
}
```

## Data Flow

### Initial Load

1. User enters NYT-S token and Anthropic API key (stored in localStorage)
2. Frontend requests puzzle data from Worker
3. Worker fetches Spelling Bee page, extracts `window.gameData`
4. Worker checks KV for cached hints
   - If cached: return puzzle + hints
   - If not: call Anthropic API, cache result, return
5. Frontend requests user's found words from Worker
6. Worker proxies request to NYT API with auth
7. Frontend displays personalized view

### Finding a Word

1. User finds word in actual Spelling Bee game
2. User refreshes Spelling Bee Buddy (or clicks "refresh" button)
3. App re-fetches user's found words
4. UI updates to show new progress

## Frontend Components

```
src/
├── components/
│   ├── Header.tsx              # Title, date, links
│   ├── ProgressBar.tsx         # Points progress toward QB
│   ├── HintsList.tsx           # AI hints grouped by prefix
│   ├── WordGrid.tsx            # Letter × Length grid
│   ├── TwoLetterList.tsx       # Two-letter prefix counts
│   ├── YouVsOthers.tsx         # Stats comparison table
│   ├── SettingsModal.tsx       # Token/API key entry
│   └── DatePicker.tsx          # Select past puzzles
├── hooks/
│   ├── usePuzzle.ts            # Fetch puzzle data
│   ├── useUserProgress.ts      # Fetch/track found words
│   └── useHints.ts             # Fetch/display hints
├── lib/
│   ├── api.ts                  # Worker API client
│   ├── storage.ts              # localStorage helpers
│   └── utils.ts                # Shared utilities
└── types/
    └── index.ts                # TypeScript interfaces
```

## Configuration

### Environment Variables

**Frontend** (in `.env`):
```
VITE_WORKER_URL=https://spelling-bee-buddy.{account}.workers.dev
```

**Worker** (in Cloudflare):
```
# Set via wrangler secret
# None needed - API keys come from user
```

### User-Provided Credentials (localStorage)

```typescript
interface UserCredentials {
  nytToken: string      // NYT-S cookie value
  anthropicKey: string  // Anthropic API key
}
```

## Future Considerations

1. **Multi-user support**: Currently single-user. For multi-user:
   - Each user provides their own NYT token
   - Hints are shared (cached by date, not user)
   - Consider rate limiting

2. **Better auth flow**:
   - Research if NYT has any OAuth or API key system
   - Browser extension could read cookies automatically
   - Bookmarklet approach

3. **Offline support**:
   - Cache puzzle data in localStorage
   - PWA with service worker (already set up in project)

4. **Historical puzzles**:
   - Need to figure out how to fetch past puzzle data
   - May require scraping archive or using third-party data

## Unresolved Questions

1. ~~How does the official SBB page get user's found words?~~ **RESOLVED**: Uses cubby API at `/svc/int/run/cubby/public-api/v1/responses/latest/spelling-bee-buddy/reader`

2. What endpoint provides the "You vs. Others" aggregate statistics? **PARTIAL**: Comes from GraphQL API, but exact query unknown. **MVP**: Skip this feature initially.

3. Is there a way to fetch historical puzzle data (past dates)? **UNKNOWN**: The game page only shows today's puzzle. May need to cache puzzle data daily, or find an archive source.

4. Rate limits on NYT API? **UNKNOWN**: Need to be careful not to get blocked. Implement caching and reasonable request intervals.

5. Should hints be regenerated if the AI output quality is poor? **DECISION**: Accept first generation for MVP. Add manual regeneration button later if needed.
