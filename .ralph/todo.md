### To do

- [ ] Make the header yellow
- [ ] In "you vs other players" the denominator should be `n` rather than `numberOfUsers`.
- [ ] Make the progress bar yellow
- [ ] For the pangrams, show little yellow hexagons that are filled or blank
- [ ] Make the filled-in dots yellow
- [ ] We don't need the totals

### Done

- [x] "I'm no longer seeing my own results for today" - Investigated but could not reproduce. Added test to verify behavior. Fixed build errors by removing unused displayWeekday/displayDate props from Header component.

- [x] Instead of the full date in the header, show "Today", "Yesterday", "Tuesday", etc. Also add a calendar icon.

- [x] Create SettingsModal stories (open, with credentials, saving state)
- [x] Create HintsList stories (empty, collapsed, expanded, complete section)
- [x] Create Header stories (with/without date picker, different dates)
- [x] Create StatsDisplay stories (no stats, loading, with data, user found vs unfound)
- [x] Create TwoLetterList stories (empty, partial progress, complete)
- [x] Create WordGrid stories (empty, partial progress, complete, single letter)
- [x] Create ProgressBar stories (beginner, mid-progress, genius, queen bee, with pangrams)
- [x] Set up Storybook with Vite and Tailwind CSS configuration
- [x] Progress tracking is available for past puzzles - just pass the correct puzzle ID

- [x] Move "you vs other players" below everything else. Replace the current display with a chart showing each word with a bar showing the percentage of players who have found it. For words found by the user, show the word. For unfound words, show just the first letter and number of letters, e.g. A (6)
- [x] Redesign TwoLetterList with dot-based display (A | AB ●●○ AC ●●●○) matching WordGrid style
- [x] Add polling to keep "other players" stats up to date (every 2 minutes, or every 30 seconds if stats aren't available yet). Show a "not available yet" message for new puzzles. Stats are also included in manual refresh.
- [x] In the header, show the icon and the title "Spelling Bee Buddy". The date should just be with the icon for choosing a different date, and doesn't need to be so prominent.
- [x] Redesign WordGrid with dot-based display (A | 4 ●●○ 5 ●●●○) showing found/unfound words
- [x] Put the date picker behind an icon in the header.
- [x] Change the icon to a stylized bee. Change the app's color scheme to yellow #F8CC10 and black.
- [x] Show how many pangrams there are and how many I've gotten.
- [x] Deploy frontend to Vercel

- [x] Configure PWA for offline support
- [x] Write Playwright tests for main flows

- [x] Create SettingsModal component for credentials
- [x] Create HintsList component with collapsible sections
- [x] Create App layout and integrate all components
- [x] Create TwoLetterList component
- [x] Create WordGrid component (letter × length grid)
- [x] Create Header component with puzzle info and links
- [x] Add CORS headers and error handling to Worker (with tests and deployment docs)
- [x] Create useHints hook
- [x] Implement Worker hint generation with Anthropic API and KV caching
- [x] Create ProgressBar component with rank display
- [x] Create useUserProgress hook
- [x] Implement Worker endpoint to proxy user progress API with auth
- [x] Create usePuzzle hook
- [x] Create api.ts with functions to call Worker endpoints
- [x] Implement Worker endpoint to fetch and parse puzzle data from NYT page
- [x] Set up Cloudflare Worker project with wrangler and KV namespace
- [x] Create TypeScript interfaces (GameData, CubbyResponse, UserStats, CachedHints, UserCredentials)
- [x] Create utils.ts with point calculation and word grouping helpers
- [x] Create storage.ts with localStorage helpers for credentials
