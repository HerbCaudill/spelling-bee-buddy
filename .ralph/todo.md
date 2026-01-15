### To do

- [ ] Put the word grid and the two-letter words in a table with borders, rather than actually displaying a | character

### Done

- [x] On the global stats, put the percentage for each word on the left side of the bar - Moved the percentage label from inside the bar (on the right) to a fixed-width column on the left side of each word bar. This improves readability and alignment. Updated tests to use data-testid for reliable element selection.

- [x] only show hints for words I haven't gotten yet - Modified HintsList to filter hints by matching prefix and word length. Added `getFoundWordsByLength` and `getUnfoundHints` helper functions to track which word lengths have been found for each prefix. When a user finds a word, hints of matching prefix and length are hidden. Added 5 new tests to verify filtering behavior.

- [x] Any time we're showing a single letter, make it bold (e.g. in the row headings of the word grid) - Changed row header letters in WordGrid and TwoLetterList from `font-medium` to `font-bold`. Updated StatsDisplay to render the first letter of unfound words in bold (e.g., "**A** (5)"). Added tests to verify the bold styling.

- [x] there's no reason why hints should only be available for today's puzzle - Extended the hints system to support any puzzle in the active puzzles list (last ~2 weeks). Added puzzleId query parameter to the /hints worker endpoint, updated frontend API and useHints hook to pass puzzle ID, and removed the "today only" restriction from the UI.

- [x] We don't need the totals - Removed the summary rows (Σ totals) from both WordGrid and TwoLetterList components. These showed the grand total count of found/total words at the bottom of each grid.

- [x] Log API requests and responses to the console so we can debug why I'm not seeing my own results. If you run chrome (using the claude extension, not playwright) - Added `logApiCall` function in api.ts that logs all API requests and responses to the console in development mode. Shows request headers (with sensitive tokens redacted), response status, and response data. Uses console.group for organized output with 🐝 emoji.

- [x] For the pangrams, show little yellow hexagons that are filled or blank - Replaced text "1 / 2 pangrams" with SVG hexagon icons. Filled yellow hexagons show found pangrams, outline hexagons show unfound pangrams. Updated tests to verify the visual representation and aria-labels for accessibility.

- [x] Make the progress bar yellow - Changed the progress bar fill from `bg-primary` (black) to `bg-accent` (yellow #F8CC10) and updated the rank markers to use `bg-accent-foreground/50` for proper contrast on the yellow bar.

- [x] Make the header yellow - Added yellow background (`bg-accent`) to the header and updated all buttons and text to use `text-accent-foreground` with appropriate hover states for proper contrast on the yellow background.

- [x] In "you vs other players" the denominator should be `n` rather than `numberOfUsers` - Fixed StatsDisplay to use `n` (sample size) instead of `numberOfUsers` for percentage calculations. The answer counts from the API are based on a sample of `n` players, so the percentages are now correct.

- [x] Make the filled-in dots yellow - Changed dots in WordGrid and TwoLetterList from text-primary (black) to text-accent (yellow #F8CC10). Also updated the complete state indicators to use yellow.

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
