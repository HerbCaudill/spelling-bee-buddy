### To do

- [ ] Use storybook to show the various components in different states
- [ ] Move "you vs other players below everything else. Replace the current display with a chart showing each word with the bar showing the percentage of people who have found it. For words that I've found, show the word. For other words, show just the first letter and number of letters, e.g. A (6)
- [ ] Progress tracking is available for past puzzles - just pass the correct puzzle ID
- [ ] Put the date picker behind an icon in the header.
- [ ] Let's try a different display for the word grid.
      A | 4 ●●●○◯ 5 ●●●◯ 6 ◯◯◯ 7 ◯
      B | 4 ◯◯◯◯◯ 5 ●◯◯
- [ ] Do something similar for the two-letter list
      A | AL ●●●○◯ AB ●●●◯ AI ◯◯◯
      B | BI ◯◯◯◯◯ 5 ●◯◯
- [ ] In the header, show the icon and the title "Spelling Bee Buddy". The date should just be with the icon for choosing a different date, and doesn't need to be so prominent.
- [ ] Figure out a way to keep the "other players" stats up to date - by polling or something. Also note, that data won't be available for a few minutes when the puzzle first comes out, so we'll need a message that says "No data yet" or something like that

---

### Done

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
