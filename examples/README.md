# NYT API Response Examples

These are real API responses captured from the NYT Spelling Bee APIs on 2026-01-15. They are used by Storybook stories to display realistic puzzle states.

## Files

### `puzzle-data.json`

**Source**: `window.gameData` from `https://www.nytimes.com/puzzles/spelling-bee`

Contains the puzzle definition:

- `centerLetter`: Required letter that must be in every word
- `outerLetters`: The 6 surrounding letters
- `validLetters`: All 7 letters combined
- `pangrams`: Words that use all 7 letters
- `answers`: All valid words for this puzzle

### `active-puzzles.json`

**Endpoint**: `GET https://www.nytimes.com/svc/spelling-bee/v1/active.json`

Contains the list of available puzzles (this week and last week):

- `today`: Index of today's puzzle in the `puzzles` array
- `yesterday`: Index of yesterday's puzzle
- `thisWeek`: Array of indices for this week's puzzles
- `lastWeek`: Array of indices for last week's puzzles
- `puzzles`: Array of puzzle objects with `id`, `center_letter`, `outer_letters`, `pangrams`, `answers`, `print_date`

### `puzzle-stats.json`

**Endpoint**: `GET https://www.nytimes.com/api/spelling-bee/v1/puzzles/{puzzleId}/wordstats.json`

Contains statistics showing how many players found each word:

- `id`: Puzzle ID
- `answers`: Object mapping each word to the number of players who found it
- `n`: Sample size (typically 10000)
- `numberOfUsers`: Total number of players

### `generated-hints.json`

**Source**: AI-generated via Anthropic API

Contains hints for each word, grouped by two-letter prefix:

- `generatedAt`: Timestamp when hints were generated
- `hints`: Object mapping two-letter prefixes to arrays of hints
- Each hint has a `hint` (clue text) and `length` (word length)
