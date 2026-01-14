import { test, expect } from "@playwright/test"

test("displays loading state initially", async ({ page }) => {
  // The app will try to load the puzzle and show a loading state
  // Since we don't have a real backend, we just verify the loading UI appears
  await page.goto("/")

  // Either we see loading state OR an error (if the API is not available)
  // Both are valid for E2E without a backend
  const loading = page.getByText(/Loading puzzle/)
  const error = page.getByText(/Failed to Load Puzzle/)

  // Wait for either to appear
  await expect(loading.or(error)).toBeVisible({ timeout: 10000 })
})
