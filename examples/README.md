# NYT API Response Examples

These are real API responses captured from the NYT Spelling Bee APIs on 2026-01-14.

## Files

### `puzzle-data.json`

**Source**: `window.gameData` from `https://www.nytimes.com/puzzles/spelling-bee`

Contains the puzzle definition:

- `centerLetter`: Required letter that must be in every word
- `outerLetters`: The 6 surrounding letters
- `validLetters`: All 7 letters combined
- `pangrams`: Words that use all 7 letters
- `answers`: All valid words for this puzzle

**Note**: This data is embedded in the game page HTML, not fetched from a separate API endpoint.

### `cubby-user-words.json`

**Endpoint**: `GET https://www.nytimes.com/svc/int/run/cubby/public-api/v1/responses/latest/spelling-bee-buddy/reader`

**Auth**: Requires `NYT-S` cookie

Contains the user's found words for the current puzzle:

- `response_id`: Unique ID for this response
- `project_version`: Puzzle ID (e.g., "20035")
- `content.words`: Array of words the user has found

### `user-stats.json`

**Endpoint**: `GET https://www.nytimes.com/svc/games/state/spelling_bee/latests`

**Auth**: Requires `NYT-S` cookie

Contains the user's overall Spelling Bee statistics:

- `puzzles_started`: Total puzzles attempted
- `total_words`: Total words found across all puzzles
- `total_pangrams`: Total pangrams found
- `longest_word`: The longest word ever found
- `ranks`: Count of each rank achieved (Queen Bee, Genius, etc.)

### `generated-hints.json`

**Source**: AI-generated (example output)

Contains Steve G style hints for each word, grouped by two-letter prefix:

- Each hint is a clever clue (wordplay, definition, cultural reference)
- `length` indicates the word length
- Users see hints but must figure out which word each hint refers to

Example hint formats:

- Equations: "Aluminum + cobalt + soda" → ALCOPOP
- Definitions: "Succulent plant" → ALOE
- Cultural references: "Yo-Yo Ma's instrument" → CELLO
- Fill-in-blank style: "Caveman diet" → PALEO

## Authentication

All authenticated endpoints require the `NYT-S` cookie, which can be extracted from browser dev tools:

1. Go to `www.nytimes.com/puzzles/spelling-bee` (while signed in)
2. Open Developer Tools (F12)
3. Go to Application > Cookies
4. Find the `NYT-S` cookie value (a long base64-like string)
