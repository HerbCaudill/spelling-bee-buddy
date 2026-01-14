### To do

- [ ] Configure PWA for offline support
- [ ] Deploy frontend to Vercel

---

### Done

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
