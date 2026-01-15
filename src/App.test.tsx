import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { App } from "./App"
import * as api from "@/lib/api"
import * as storage from "@/lib/storage"
import type { CubbyResponse, ActivePuzzlesResponse, PuzzleStats } from "@/types"

// Mock the API module
vi.mock("@/lib/api")
const mockedApi = vi.mocked(api)

// Mock the storage module
vi.mock("@/lib/storage")
const mockedStorage = vi.mocked(storage)

const mockActivePuzzles: ActivePuzzlesResponse = {
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
      answers: ["cope", "coal", "boat", "peaceable", "able", "bale", "pale"],
      print_date: "2025-01-15",
      editor: "Sam Ezersky",
    },
  ],
}

const mockStats: PuzzleStats = {
  id: 20035,
  answers: {
    cope: 8000,
    coal: 9000,
    boat: 7500,
    peaceable: 3000,
    able: 9500,
    bale: 6000,
    pale: 8500,
  },
  n: 10000,
  numberOfUsers: 10000,
}

const mockProgress: CubbyResponse = {
  response_id: "123",
  project_version: "20035",
  correct: null,
  content: {
    words: ["cope", "coal", "peaceable"],
  },
}

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Default: no credentials
    mockedStorage.getCredentials.mockReturnValue(null)
    // Default: stats succeed
    mockedApi.fetchPuzzleStats.mockResolvedValue(mockStats)
  })

  describe("loading state", () => {
    it("shows loading spinner while fetching puzzle", () => {
      // Make fetchActivePuzzles hang
      mockedApi.fetchActivePuzzles.mockImplementation(() => new Promise(() => {}))

      render(<App />)

      expect(screen.getByText(/Loading puzzle/)).toBeInTheDocument()
    })
  })

  describe("error state", () => {
    it("shows error message when puzzle fails to load", async () => {
      mockedApi.fetchActivePuzzles.mockRejectedValue(new Error("Network error"))

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load puzzle/)).toBeInTheDocument()
      })
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Try again/ })).toBeInTheDocument()
    })

    it("retries loading when Try again is clicked", async () => {
      const user = userEvent.setup()
      mockedApi.fetchActivePuzzles.mockRejectedValueOnce(new Error("Network error"))
      mockedApi.fetchActivePuzzles.mockResolvedValueOnce(mockActivePuzzles)

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to load puzzle/)).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /Try again/ }))

      await waitFor(() => {
        expect(screen.getByText("Wednesday")).toBeInTheDocument()
      })
    })
  })

  describe("successful render", () => {
    beforeEach(() => {
      mockedApi.fetchActivePuzzles.mockResolvedValue(mockActivePuzzles)
    })

    it("renders header with puzzle date", async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText("Wednesday")).toBeInTheDocument()
      })
      expect(screen.getByText("January 15, 2025")).toBeInTheDocument()
    })

    it("renders progress bar", async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText("Beginner")).toBeInTheDocument()
      })
    })

    it("renders word grid", async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText("Word grid")).toBeInTheDocument()
      })
    })

    it("renders two-letter list", async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText("Two-letter list")).toBeInTheDocument()
      })
    })

    it("renders refresh button", async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Refresh progress/ })).toBeInTheDocument()
      })
    })

    it("shows tip when no credentials are configured", async () => {
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/Click the settings icon/)).toBeInTheDocument()
      })
    })

    it("hides tip when credentials are configured", async () => {
      mockedStorage.getCredentials.mockReturnValue({
        nytToken: "test-token",
        anthropicKey: "test-key",
      })
      mockedApi.fetchProgress.mockResolvedValue(mockProgress)

      render(<App />)

      // Wait for progress to load (indicated by points being displayed)
      // This ensures hasCredentials state has been updated
      await waitFor(() => {
        expect(screen.getByText(/18/)).toBeInTheDocument()
      })

      expect(screen.queryByText(/Click the settings icon/)).not.toBeInTheDocument()
    })

    it("updates progress when credentials are configured", async () => {
      mockedStorage.getCredentials.mockReturnValue({
        nytToken: "test-token",
        anthropicKey: "test-key",
      })
      mockedApi.fetchProgress.mockResolvedValue(mockProgress)

      render(<App />)

      await waitFor(() => {
        // Check that the current points reflect found words
        // 3 words found: cope (1), coal (1), peaceable (9+7 pangram bonus) = 18 points
        expect(screen.getByText(/18/)).toBeInTheDocument()
      })
    })
  })

  describe("settings modal", () => {
    beforeEach(() => {
      mockedApi.fetchActivePuzzles.mockResolvedValue(mockActivePuzzles)
    })

    it("opens settings modal when settings button is clicked", async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText("Wednesday")).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /Open settings/ }))

      expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument()
      expect(screen.getByLabelText("NYT Token")).toBeInTheDocument()
      expect(screen.getByLabelText("Anthropic API Key")).toBeInTheDocument()
    })

    it("closes settings modal when Cancel button is clicked", async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText("Wednesday")).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /Open settings/ }))
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Cancel" }))
      expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument()
    })

    it("closes settings modal when Escape is pressed", async () => {
      const user = userEvent.setup()
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText("Wednesday")).toBeInTheDocument()
      })

      await user.click(screen.getByRole("button", { name: /Open settings/ }))
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument()

      await user.keyboard("{Escape}")
      expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument()
    })
  })

  describe("refresh functionality", () => {
    beforeEach(() => {
      mockedApi.fetchActivePuzzles.mockResolvedValue(mockActivePuzzles)
    })

    it("refetches data when refresh button is clicked", async () => {
      const user = userEvent.setup()
      mockedStorage.getCredentials.mockReturnValue({
        nytToken: "test-token",
        anthropicKey: "test-key",
      })
      mockedApi.fetchProgress.mockResolvedValue(mockProgress)

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText("Wednesday")).toBeInTheDocument()
      })

      // Clear the mock calls
      mockedApi.fetchActivePuzzles.mockClear()
      mockedApi.fetchProgress.mockClear()

      await user.click(screen.getByRole("button", { name: /Refresh progress/ }))

      await waitFor(() => {
        expect(mockedApi.fetchActivePuzzles).toHaveBeenCalled()
        expect(mockedApi.fetchProgress).toHaveBeenCalled()
      })
    })
  })

  describe("progress error handling", () => {
    beforeEach(() => {
      mockedApi.fetchActivePuzzles.mockResolvedValue(mockActivePuzzles)
    })

    it("shows progress error message when fetching progress fails", async () => {
      mockedStorage.getCredentials.mockReturnValue({
        nytToken: "test-token",
        anthropicKey: "test-key",
      })
      mockedApi.fetchProgress.mockRejectedValue(new Error("Progress fetch failed"))

      render(<App />)

      await waitFor(() => {
        expect(screen.getByText(/Progress fetch failed/)).toBeInTheDocument()
      })

      // The puzzle should still render even with progress error
      expect(screen.getByText("Wednesday")).toBeInTheDocument()
    })
  })
})
