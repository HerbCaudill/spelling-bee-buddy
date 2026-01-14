import { test, expect, Page, Route } from "@playwright/test"

// Mock data matching the types in src/types/index.ts
const mockPuzzle = {
  success: true,
  data: {
    today: {
      displayWeekday: "Wednesday",
      displayDate: "January 15, 2025",
      printDate: "2025-01-15",
      centerLetter: "o",
      outerLetters: ["a", "b", "c", "e", "l", "p"],
      validLetters: ["o", "a", "b", "c", "e", "l", "p"],
      pangrams: ["peaceable"],
      answers: ["cope", "coal", "boat", "peaceable", "able", "bale", "pale", "lope", "pole", "opal"],
      id: 20035,
    },
  },
}

const mockProgress = {
  success: true,
  data: {
    response_id: "123",
    project_version: "20035",
    correct: null,
    content: {
      words: ["cope", "coal", "peaceable"],
    },
  },
}

const mockHints = {
  success: true,
  data: {
    generatedAt: "2025-01-15T12:00:00Z",
    hints: {
      AB: [{ hint: "Capable of being done", length: 4 }],
      BA: [{ hint: "Something you tie around your waist", length: 4 }],
      BO: [{ hint: "A watercraft", length: 4 }],
      CO: [
        { hint: "Handle a difficult situation", length: 4 },
        { hint: "A black mineral used for fuel", length: 4 },
      ],
      LO: [{ hint: "Move with long strides", length: 4 }],
      OP: [{ hint: "A gemstone", length: 4 }],
      PA: [{ hint: "Not bright in color", length: 4 }],
      PE: [{ hint: "Can be calmed or satisfied", length: 9 }],
      PO: [{ hint: "A long stick", length: 4 }],
    },
  },
}

/**
 * Setup route mocking for the worker API
 */
async function setupMocks(
  page: Page,
  options: {
    puzzleResponse?: object | ((route: Route) => void)
    progressResponse?: object | ((route: Route) => void)
    hintsResponse?: object | ((route: Route) => void)
    puzzleDelay?: number
    progressDelay?: number
    hintsDelay?: number
  } = {}
) {
  const {
    puzzleResponse = mockPuzzle,
    progressResponse = mockProgress,
    hintsResponse = mockHints,
    puzzleDelay = 0,
    progressDelay = 0,
    hintsDelay = 0,
  } = options

  // Mock puzzle endpoint
  await page.route("**/puzzle", async (route) => {
    if (puzzleDelay) await new Promise((r) => setTimeout(r, puzzleDelay))
    if (typeof puzzleResponse === "function") {
      puzzleResponse(route)
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(puzzleResponse),
      })
    }
  })

  // Mock progress endpoint
  await page.route("**/progress", async (route) => {
    if (progressDelay) await new Promise((r) => setTimeout(r, progressDelay))
    if (typeof progressResponse === "function") {
      progressResponse(route)
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(progressResponse),
      })
    }
  })

  // Mock hints endpoint
  await page.route("**/hints", async (route) => {
    if (hintsDelay) await new Promise((r) => setTimeout(r, hintsDelay))
    if (typeof hintsResponse === "function") {
      hintsResponse(route)
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(hintsResponse),
      })
    }
  })
}

test.describe("Loading state", () => {
  test("displays loading state initially", async ({ page }) => {
    await setupMocks(page, { puzzleDelay: 1000 })
    await page.goto("/")

    await expect(page.getByText(/Loading puzzle/)).toBeVisible()
  })

  test("shows spinner icon during loading", async ({ page }) => {
    await setupMocks(page, { puzzleDelay: 1000 })
    await page.goto("/")

    // The Loader2 icon has the animate-spin class
    await expect(page.locator(".animate-spin")).toBeVisible()
  })
})

test.describe("Error state", () => {
  test("shows error message when puzzle fails to load", async ({ page }) => {
    await setupMocks(page, {
      puzzleResponse: (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Server unavailable" }),
        }),
    })

    await page.goto("/")

    await expect(page.getByText(/Failed to Load Puzzle/)).toBeVisible()
    await expect(page.getByText(/Server unavailable/)).toBeVisible()
  })

  test("shows Try Again button on error", async ({ page }) => {
    await setupMocks(page, {
      puzzleResponse: (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Server unavailable" }),
        }),
    })

    await page.goto("/")

    await expect(page.getByRole("button", { name: /Try Again/ })).toBeVisible()
  })

  test("retries loading when Try Again is clicked", async ({ page }) => {
    let callCount = 0
    await setupMocks(page, {
      puzzleResponse: (route) => {
        callCount++
        if (callCount === 1) {
          route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ success: false, error: "Server unavailable" }),
          })
        } else {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(mockPuzzle),
          })
        }
      },
    })

    await page.goto("/")
    await expect(page.getByText(/Failed to Load Puzzle/)).toBeVisible()

    await page.getByRole("button", { name: /Try Again/ }).click()

    await expect(page.getByText("Wednesday")).toBeVisible()
  })
})

test.describe("Main app render", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
  })

  test("renders header with puzzle date", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByText("Wednesday")).toBeVisible()
    await expect(page.getByText("January 15, 2025")).toBeVisible()
  })

  test("renders NYT Spelling Bee link", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("link", { name: /Open NYT Spelling Bee puzzle/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /Open NYT Spelling Bee puzzle/ })).toHaveAttribute(
      "href",
      "https://www.nytimes.com/puzzles/spelling-bee"
    )
  })

  test("renders settings button", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("button", { name: /Open settings/ })).toBeVisible()
  })

  test("renders progress bar section", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("region", { name: "Progress" })).toBeVisible()
  })

  test("renders word grid section", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByText("Word Grid")).toBeVisible()
    await expect(page.getByRole("region", { name: "Word grid" })).toBeVisible()
  })

  test("renders two-letter list section", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByText("Two-Letter List")).toBeVisible()
    await expect(page.getByRole("region", { name: "Two-letter list" })).toBeVisible()
  })

  test("renders refresh progress button", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("button", { name: /Refresh Progress/ })).toBeVisible()
  })

  test("shows tip when no credentials are configured", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByText(/Click the settings icon to add your NYT token/)).toBeVisible()
  })
})

test.describe("Progress tracking", () => {
  test("displays progress when credentials are configured", async ({ page }) => {
    await setupMocks(page)

    // Set credentials in localStorage before navigating
    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "test-token",
          anthropicKey: "test-key",
        })
      )
    })

    await page.goto("/")

    // With found words: cope (1), coal (1), peaceable (9+7) = 18 points
    // Points are displayed as "18 / X points"
    await expect(page.getByText(/18 \/ \d+ points/)).toBeVisible()
  })

  test("hides tip when credentials are configured", async ({ page }) => {
    await setupMocks(page)

    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "test-token",
          anthropicKey: "test-key",
        })
      )
    })

    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    // Wait for progress to load, then check tip is hidden
    await expect(page.getByText(/18 \/ \d+ points/)).toBeVisible()
    await expect(page.getByText(/Click the settings icon to add your NYT token/)).not.toBeVisible()
  })

  test("shows progress error without breaking the app", async ({ page }) => {
    await setupMocks(page, {
      progressResponse: (route) =>
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Invalid token" }),
        }),
    })

    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "invalid-token",
          anthropicKey: "test-key",
        })
      )
    })

    await page.goto("/")

    // App should still render
    await expect(page.getByText("Wednesday")).toBeVisible()
    // Error message should be visible (the hook transforms 401 to a specific message)
    await expect(page.getByText(/Invalid or expired NYT token/)).toBeVisible()
  })
})

test.describe("Settings modal", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
  })

  test("opens settings modal when settings button is clicked", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()

    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()
    // Use the input role to avoid matching the show/hide button
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toBeVisible()
  })

  test("closes settings modal when Cancel button is clicked", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()

    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()
  })

  test("closes settings modal when close button is clicked", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()

    await page.getByRole("button", { name: /Close settings/ }).click()

    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()
  })

  test("closes settings modal when Escape is pressed", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()

    await page.keyboard.press("Escape")

    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()
  })

  test("closes settings modal when clicking outside", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()

    // Click on the overlay (outside the modal content)
    await page.locator(".fixed.inset-0").click({ position: { x: 10, y: 10 } })

    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()
  })

  test("saves credentials when Save button is clicked", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()

    await page.getByRole("textbox", { name: "NYT Token" }).fill("my-nyt-token")
    await page.getByRole("textbox", { name: "Anthropic API Key" }).fill("my-api-key")

    await page.getByRole("button", { name: "Save" }).click()

    // Modal should close
    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()

    // Verify credentials were saved by reopening modal
    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toHaveValue("my-nyt-token")
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toHaveValue("my-api-key")
  })

  test("clears credentials when Clear All button is clicked", async ({ page }) => {
    // Set existing credentials
    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "existing-token",
          anthropicKey: "existing-key",
        })
      )
    })

    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()

    // Verify existing credentials are loaded
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toHaveValue("existing-token")
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toHaveValue("existing-key")

    await page.getByRole("button", { name: /Clear All/ }).click()

    // Fields should be cleared
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toHaveValue("")
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toHaveValue("")
  })

  test("shows/hides password fields", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()

    const nytTokenInput = page.getByRole("textbox", { name: "NYT Token" })
    await nytTokenInput.fill("secret-token")

    // Field should be password type by default
    await expect(nytTokenInput).toHaveAttribute("type", "password")

    // Click show button
    await page.getByRole("button", { name: /Show NYT token/ }).click()

    // Field should now be text type
    await expect(nytTokenInput).toHaveAttribute("type", "text")

    // Click hide button
    await page.getByRole("button", { name: /Hide NYT token/ }).click()

    // Field should be password type again
    await expect(nytTokenInput).toHaveAttribute("type", "password")
  })
})

test.describe("Hints section", () => {
  test("shows tip when no API key is configured", async ({ page }) => {
    await setupMocks(page)
    await page.goto("/")

    await expect(page.getByText(/Add your Anthropic API key in settings/)).toBeVisible()
  })

  test("shows hints section when API key is configured", async ({ page }) => {
    await setupMocks(page)

    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "",
          anthropicKey: "test-api-key",
        })
      )
    })

    await page.goto("/")

    // Wait for puzzle to load first
    await expect(page.getByText("Wednesday")).toBeVisible()

    // Wait for hints to load - check for the Hints header
    await expect(page.getByRole("heading", { name: "Hints" })).toBeVisible()

    // Check for Expand all / Collapse all controls
    await expect(page.getByRole("button", { name: "Expand all sections" })).toBeVisible()

    // Check that hint prefixes are displayed (hints are in collapsible sections)
    await expect(page.getByRole("button", { name: /^AB/ })).toBeVisible()
  })

  test("can expand hint sections to see hint text", async ({ page }) => {
    await setupMocks(page)

    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "",
          anthropicKey: "test-api-key",
        })
      )
    })

    await page.goto("/")

    // Wait for puzzle and hints to load
    await expect(page.getByText("Wednesday")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Hints" })).toBeVisible()

    // Click on AB prefix to expand
    await page.getByRole("button", { name: /^AB/ }).click()

    // Now the hint text should be visible
    await expect(page.getByText("Capable of being done")).toBeVisible()
  })

  test("shows loading state while fetching hints", async ({ page }) => {
    await setupMocks(page, { hintsDelay: 2000 })

    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "",
          anthropicKey: "test-api-key",
        })
      )
    })

    await page.goto("/")

    // Wait for puzzle to load first
    await expect(page.getByText("Wednesday")).toBeVisible()

    // Then check for hints loading state
    await expect(page.getByText(/Generating hints/)).toBeVisible()
  })

  test("shows error when hints fetch fails", async ({ page }) => {
    await setupMocks(page, {
      hintsResponse: (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Hints generation failed" }),
        }),
    })

    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "",
          anthropicKey: "test-api-key",
        })
      )
    })

    await page.goto("/")

    // Wait for puzzle to load first
    await expect(page.getByText("Wednesday")).toBeVisible()

    // Then check for hints error
    await expect(page.getByText(/Hints generation failed/)).toBeVisible()
  })
})

test.describe("Refresh functionality", () => {
  test("refresh button triggers data refetch", async ({ page }) => {
    let progressCallCount = 0

    await setupMocks(page, {
      progressResponse: (route) => {
        progressCallCount++
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockProgress),
        })
      },
    })

    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "test-token",
          anthropicKey: "test-key",
        })
      )
    })

    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    // Wait for initial progress fetch - points displayed as "18 / X points"
    await expect(page.getByText(/18 \/ \d+ points/)).toBeVisible()

    const initialCallCount = progressCallCount

    // Click refresh
    await page.getByRole("button", { name: /Refresh Progress/ }).click()

    // Wait for refetch
    await page.waitForTimeout(500)

    expect(progressCallCount).toBeGreaterThan(initialCallCount)
  })
})

test.describe("Word Grid interaction", () => {
  test("displays word counts in grid", async ({ page }) => {
    await setupMocks(page)
    await page.goto("/")

    await expect(page.getByText("Word Grid")).toBeVisible()

    // The word grid should show letters and counts
    // Our mock data has words starting with various letters at length 4
    await expect(page.getByRole("region", { name: "Word grid" })).toBeVisible()
  })
})

test.describe("Two-Letter List interaction", () => {
  test("displays two-letter groups", async ({ page }) => {
    await setupMocks(page)
    await page.goto("/")

    await expect(page.getByText("Two-Letter List")).toBeVisible()
    await expect(page.getByRole("region", { name: "Two-letter list" })).toBeVisible()
  })
})

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
  })

  test("has proper heading structure", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    // Main heading is the weekday
    const h1 = page.getByRole("heading", { level: 1 })
    await expect(h1).toHaveText("Wednesday")
  })

  test("has proper landmark regions", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    // Header
    await expect(page.getByRole("banner")).toBeVisible()

    // Main content
    await expect(page.getByRole("main")).toBeVisible()
  })

  test("modal has proper ARIA attributes", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()

    const dialog = page.getByRole("dialog", { name: "Settings" })
    await expect(dialog).toHaveAttribute("aria-modal", "true")
  })

  test("form inputs have proper labels", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Wednesday")).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()

    // These should be findable by role and name (label)
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toBeVisible()
  })
})
