import { test, expect, Page, Route } from "@playwright/test"

/**
 * Helper to wait for app to load and verify date is displayed
 * Since the date is now shown as a relative date, we check for the time element
 */
async function waitForAppToLoad(page: Page) {
  const timeElement = page.getByRole("time")
  await expect(timeElement).toBeVisible()
  await expect(timeElement).toHaveAttribute("datetime", "2025-01-15")
}

// Mock data matching the new ActivePuzzlesResponse format
const mockActivePuzzles = {
  success: true,
  data: {
    today: 0,
    yesterday: 0,
    thisWeek: [0],
    lastWeek: [],
    puzzles: [
      {
        id: 20035,
        center_letter: "o",
        outer_letters: "abcelp",
        pangrams: ["peaceable"],
        answers: [
          "cope",
          "coal",
          "boat",
          "peaceable",
          "able",
          "bale",
          "pale",
          "lope",
          "pole",
          "opal",
        ],
        print_date: "2025-01-15",
        editor: "Sam Ezersky",
      },
    ],
  },
}

const mockStats = {
  success: true,
  data: {
    id: 20035,
    answers: {
      cope: 8000,
      coal: 9000,
      boat: 7500,
      peaceable: 3000,
      able: 9500,
      bale: 6000,
      pale: 8500,
      lope: 7000,
      pole: 8000,
      opal: 6500,
    },
    n: 10000,
    numberOfUsers: 10000,
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
    activeResponse?: object | ((route: Route) => void)
    statsResponse?: object | ((route: Route) => void)
    progressResponse?: object | ((route: Route) => void)
    hintsResponse?: object | ((route: Route) => void)
    activeDelay?: number
    statsDelay?: number
    progressDelay?: number
    hintsDelay?: number
  } = {},
) {
  const {
    activeResponse = mockActivePuzzles,
    statsResponse = mockStats,
    progressResponse = mockProgress,
    hintsResponse = mockHints,
    activeDelay = 0,
    statsDelay = 0,
    progressDelay = 0,
    hintsDelay = 0,
  } = options

  // Mock active puzzles endpoint
  await page.route("**/active", async route => {
    if (activeDelay) await new Promise(r => setTimeout(r, activeDelay))
    if (typeof activeResponse === "function") {
      activeResponse(route)
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(activeResponse),
      })
    }
  })

  // Mock stats endpoint
  await page.route("**/stats/*", async route => {
    if (statsDelay) await new Promise(r => setTimeout(r, statsDelay))
    if (typeof statsResponse === "function") {
      statsResponse(route)
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(statsResponse),
      })
    }
  })

  // Mock progress endpoint (matches both /progress and /progress?puzzleId=*)
  await page.route("**/progress*", async route => {
    if (progressDelay) await new Promise(r => setTimeout(r, progressDelay))
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

  // Mock hints endpoint (matches both /hints and /hints?puzzleId=*)
  await page.route("**/hints*", async route => {
    if (hintsDelay) await new Promise(r => setTimeout(r, hintsDelay))
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
    await setupMocks(page, { activeDelay: 1000 })
    await page.goto("/")

    await expect(page.getByText(/Loading puzzle/)).toBeVisible()
  })

  test("shows spinner icon during loading", async ({ page }) => {
    await setupMocks(page, { activeDelay: 1000 })
    await page.goto("/")

    // The Loader2 icon has the animate-spin class
    await expect(page.locator(".animate-spin")).toBeVisible()
  })
})

test.describe("Error state", () => {
  test("shows error message when puzzle fails to load", async ({ page }) => {
    await setupMocks(page, {
      activeResponse: route =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Server unavailable" }),
        }),
    })

    await page.goto("/")

    await expect(page.getByText(/Failed to load puzzle/)).toBeVisible()
    await expect(page.getByText(/Server unavailable/)).toBeVisible()
  })

  test("shows Try again button on error", async ({ page }) => {
    await setupMocks(page, {
      activeResponse: route =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ success: false, error: "Server unavailable" }),
        }),
    })

    await page.goto("/")

    await expect(page.getByRole("button", { name: /Try again/ })).toBeVisible()
  })

  test("retries loading when Try again is clicked", async ({ page }) => {
    let callCount = 0
    await setupMocks(page, {
      activeResponse: route => {
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
            body: JSON.stringify(mockActivePuzzles),
          })
        }
      },
    })

    await page.goto("/")
    await expect(page.getByText(/Failed to load puzzle/)).toBeVisible()

    await page.getByRole("button", { name: /Try again/ }).click()

    // Date is now shown as a relative date, check the time element has the correct datetime
    const timeElement = page.getByRole("time")
    await expect(timeElement).toBeVisible()
    await expect(timeElement).toHaveAttribute("datetime", "2025-01-15")
  })
})

test.describe("Main app render", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
  })

  test("renders header with puzzle date", async ({ page }) => {
    await page.goto("/")

    // Date is now shown as a relative date (e.g., "Today", "Yesterday", day name, or full date)
    // The mock date is 2025-01-15, so we check for the time element with correct datetime attribute
    const timeElement = page.getByRole("time")
    await expect(timeElement).toBeVisible()
    await expect(timeElement).toHaveAttribute("datetime", "2025-01-15")
  })

  test("renders NYT Spelling Bee link", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await expect(page.getByRole("link", { name: /Open NYT Spelling Bee puzzle/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /Open NYT Spelling Bee puzzle/ })).toHaveAttribute(
      "href",
      "https://www.nytimes.com/puzzles/spelling-bee/2025-01-15",
    )
  })

  test("renders settings button", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await expect(page.getByRole("button", { name: /Open settings/ })).toBeVisible()
  })

  test("renders progress bar section", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await expect(page.getByRole("region", { name: "Progress" })).toBeVisible()
  })

  test("renders word grid section", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await expect(page.getByText("Word grid")).toBeVisible()
    await expect(page.getByRole("region", { name: "Word grid" })).toBeVisible()
  })

  test("renders two-letter list section", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await expect(page.getByText("Two-letter list")).toBeVisible()
    await expect(page.getByRole("region", { name: "Two-letter list" })).toBeVisible()
  })

  test("renders refresh progress button", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await expect(page.getByRole("button", { name: /Refresh progress/ })).toBeVisible()
  })

  test("shows tip when no credentials are configured", async ({ page }) => {
    // Explicitly clear credentials to ensure env variables don't interfere
    // (In DEV mode, getCredentials() falls back to env variables if localStorage is empty)
    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "",
          anthropicKey: "",
        }),
      )
    })

    await page.goto("/")
    await waitForAppToLoad(page)

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
        }),
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
        }),
      )
    })

    await page.goto("/")
    await waitForAppToLoad(page)

    // Wait for progress to load, then check tip is hidden
    await expect(page.getByText(/18 \/ \d+ points/)).toBeVisible()
    await expect(page.getByText(/Click the settings icon to add your NYT token/)).not.toBeVisible()
  })

  test("shows progress error without breaking the app", async ({ page }) => {
    await setupMocks(page, {
      progressResponse: route =>
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
        }),
      )
    })

    await page.goto("/")

    // App should still render
    await waitForAppToLoad(page)
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
    await waitForAppToLoad(page)

    await page.getByRole("button", { name: /Open settings/ }).click()

    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()
    // Use the input role to avoid matching the show/hide button
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toBeVisible()
  })

  test("closes settings modal when Cancel button is clicked", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()

    await page.getByRole("button", { name: "Cancel" }).click()

    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()
  })

  test("closes settings modal when close button is clicked", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()

    await page.getByRole("button", { name: /Close settings/ }).click()

    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()
  })

  test("closes settings modal when Escape is pressed", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()

    await page.keyboard.press("Escape")

    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()
  })

  test("closes settings modal when clicking outside", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await page.getByRole("button", { name: /Open settings/ }).click()
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible()

    // Click on the overlay (outside the modal content)
    await page.locator(".fixed.inset-0").click({ position: { x: 10, y: 10 } })

    await expect(page.getByRole("dialog", { name: "Settings" })).not.toBeVisible()
  })

  test("saves credentials when Save button is clicked", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

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
        }),
      )
    })

    await page.goto("/")
    await waitForAppToLoad(page)

    await page.getByRole("button", { name: /Open settings/ }).click()

    // Verify existing credentials are loaded
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toHaveValue("existing-token")
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toHaveValue(
      "existing-key",
    )

    await page.getByRole("button", { name: /Clear All/ }).click()

    // Fields should be cleared
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toHaveValue("")
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toHaveValue("")
  })

  test("shows credentials in plain text", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await page.getByRole("button", { name: /Open settings/ }).click()

    const nytTokenInput = page.getByRole("textbox", { name: "NYT Token" })
    const anthropicKeyInput = page.getByRole("textbox", { name: "Anthropic API Key" })

    // Fields should be plain text type
    await expect(nytTokenInput).toHaveAttribute("type", "text")
    await expect(anthropicKeyInput).toHaveAttribute("type", "text")
  })
})

test.describe("Hints section", () => {
  test("shows tip when no API key is configured", async ({ page }) => {
    await setupMocks(page)

    // Explicitly set empty credentials to ensure env variables don't interfere
    // (In DEV mode, getCredentials() falls back to env variables if localStorage is empty)
    await page.addInitScript(() => {
      localStorage.setItem(
        "spelling-bee-buddy-credentials",
        JSON.stringify({
          nytToken: "",
          anthropicKey: "",
        }),
      )
    })

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
        }),
      )
    })

    await page.goto("/")

    // Wait for puzzle to load first
    await waitForAppToLoad(page)

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
        }),
      )
    })

    await page.goto("/")

    // Wait for puzzle and hints to load
    await waitForAppToLoad(page)
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
        }),
      )
    })

    await page.goto("/")

    // Wait for puzzle to load first
    await waitForAppToLoad(page)

    // Then check for hints loading state
    await expect(page.getByText(/Generating hints/)).toBeVisible()
  })

  test("shows error when hints fetch fails", async ({ page }) => {
    await setupMocks(page, {
      hintsResponse: route =>
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
        }),
      )
    })

    await page.goto("/")

    // Wait for puzzle to load first
    await waitForAppToLoad(page)

    // Then check for hints error
    await expect(page.getByText(/Hints generation failed/)).toBeVisible()
  })
})

test.describe("Refresh functionality", () => {
  test("refresh button triggers data refetch", async ({ page }) => {
    let progressCallCount = 0

    await setupMocks(page, {
      progressResponse: route => {
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
        }),
      )
    })

    await page.goto("/")
    await waitForAppToLoad(page)

    // Wait for initial progress fetch - points displayed as "18 / X points"
    await expect(page.getByText(/18 \/ \d+ points/)).toBeVisible()

    const initialCallCount = progressCallCount

    // Click refresh
    await page.getByRole("button", { name: /Refresh progress/ }).click()

    // Wait for refetch
    await page.waitForTimeout(500)

    expect(progressCallCount).toBeGreaterThan(initialCallCount)
  })
})

test.describe("Word Grid interaction", () => {
  test("displays word counts in grid", async ({ page }) => {
    await setupMocks(page)
    await page.goto("/")

    await expect(page.getByText("Word grid")).toBeVisible()

    // The word grid should show letters and counts
    // Our mock data has words starting with various letters at length 4
    await expect(page.getByRole("region", { name: "Word grid" })).toBeVisible()
  })
})

test.describe("Two-Letter List interaction", () => {
  test("displays two-letter groups", async ({ page }) => {
    await setupMocks(page)
    await page.goto("/")

    await expect(page.getByText("Two-letter list")).toBeVisible()
    await expect(page.getByRole("region", { name: "Two-letter list" })).toBeVisible()
  })
})

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page)
  })

  test("has proper heading structure", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Spelling Bee Buddy" })).toBeVisible()

    // Main heading is the app title
    const h1 = page.getByRole("heading", { level: 1 })
    await expect(h1).toHaveText("Spelling Bee Buddy")
  })

  test("has proper landmark regions", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Spelling Bee Buddy" })).toBeVisible()

    // Header
    await expect(page.getByRole("banner")).toBeVisible()

    // Main content
    await expect(page.getByRole("main")).toBeVisible()
  })

  test("modal has proper ARIA attributes", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Spelling Bee Buddy" })).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()

    const dialog = page.getByRole("dialog", { name: "Settings" })
    await expect(dialog).toHaveAttribute("aria-modal", "true")
  })

  test("form inputs have proper labels", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Spelling Bee Buddy" })).toBeVisible()

    await page.getByRole("button", { name: /Open settings/ }).click()

    // These should be findable by role and name (label)
    await expect(page.getByRole("textbox", { name: "NYT Token" })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Anthropic API Key" })).toBeVisible()
  })
})

// Multi-puzzle mock for routing tests
const mockMultiPuzzles = {
  success: true,
  data: {
    today: 1,
    yesterday: 0,
    thisWeek: [0, 1],
    lastWeek: [],
    puzzles: [
      {
        id: 20034,
        center_letter: "a",
        outer_letters: "bcdelp",
        pangrams: ["placeable"],
        answers: ["able", "bale", "pale", "place", "placeable"],
        print_date: "2025-01-14",
        editor: "Sam Ezersky",
      },
      {
        id: 20035,
        center_letter: "o",
        outer_letters: "abcelp",
        pangrams: ["peaceable"],
        answers: [
          "cope",
          "coal",
          "boat",
          "peaceable",
          "able",
          "bale",
          "pale",
          "lope",
          "pole",
          "opal",
        ],
        print_date: "2025-01-15",
        editor: "Sam Ezersky",
      },
    ],
  },
}

test.describe("URL-based date routing", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, { activeResponse: mockMultiPuzzles })
  })

  test("navigating to / redirects URL to today's date", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    await expect(page).toHaveURL(/\/2025-01-15$/)
  })

  test("navigating to a valid date loads that puzzle", async ({ page }) => {
    await page.goto("/2025-01-14")

    const timeElement = page.getByRole("time")
    await expect(timeElement).toBeVisible()
    await expect(timeElement).toHaveAttribute("datetime", "2025-01-14")
    await expect(page).toHaveURL(/\/2025-01-14$/)
  })

  test("navigating to an invalid date redirects to today", async ({ page }) => {
    await page.goto("/not-a-date")
    await waitForAppToLoad(page)

    await expect(page).toHaveURL(/\/2025-01-15$/)
  })

  test("selecting a puzzle via date picker updates the URL", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    // Open the date picker popover
    await page.getByRole("button", { name: /Choose a different puzzle date/ }).click()

    // Click the previous puzzle button inside the popover
    await page.getByRole("button", { name: /Previous puzzle/ }).click()

    const timeElement = page.getByRole("time")
    await expect(timeElement).toHaveAttribute("datetime", "2025-01-14")
    await expect(page).toHaveURL(/\/2025-01-14$/)
  })

  test("browser back navigates to previous puzzle", async ({ page }) => {
    await page.goto("/")
    await waitForAppToLoad(page)

    // Open date picker and navigate to previous puzzle
    await page.getByRole("button", { name: /Choose a different puzzle date/ }).click()
    await page.getByRole("button", { name: /Previous puzzle/ }).click()
    await expect(page).toHaveURL(/\/2025-01-14$/)

    // Go back
    await page.goBack()
    await expect(page).toHaveURL(/\/2025-01-15$/)

    const timeElement = page.getByRole("time")
    await expect(timeElement).toHaveAttribute("datetime", "2025-01-15")
  })
})
