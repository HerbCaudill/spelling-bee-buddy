### To do

- [ ] Implement Worker hint generation with Anthropic API and KV caching
- [ ] Add CORS headers and error handling to Worker, deploy to Cloudflare
- [ ] Create useHints hook
- [ ] Create Header component with puzzle info and links
- [ ] Create WordGrid component (letter × length grid)
- [ ] Create TwoLetterList component
- [ ] Create HintsList component with collapsible sections
- [ ] Create SettingsModal component for credentials
- [ ] Create App layout and integrate all components
- [ ] Write Playwright tests for main flows
- [ ] Configure PWA for offline support
- [ ] Deploy frontend to Vercel

---

### Done

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
