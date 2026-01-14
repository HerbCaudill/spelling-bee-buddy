import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useUserProgress } from "./useUserProgress"
import * as api from "@/lib/api"
import * as storage from "@/lib/storage"
import type { CubbyResponse, UserCredentials } from "@/types"

// Mock the api module
vi.mock("@/lib/api", () => ({
  fetchProgress: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message)
      this.name = "ApiError"
    }
  },
}))

// Mock the storage module
vi.mock("@/lib/storage", () => ({
  getCredentials: vi.fn(),
}))

const mockCredentials: UserCredentials = {
  nytToken: "test-nyt-token",
  nytSubscriberId: "test-subscriber-id",
  anthropicKey: "test-anthropic-key",
}

const mockCubbyResponse: CubbyResponse = {
  response_id: "resp-123",
  project_version: "20035",
  correct: null,
  content: {
    words: ["able", "bale", "placebo"],
  },
}

const mockPangrams = ["placebo"]

describe("useUserProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("without credentials", () => {
    beforeEach(() => {
      vi.mocked(storage.getCredentials).mockReturnValue(null)
    })

    it("should return empty found words when no credentials", async () => {
      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.foundWords).toEqual([])
      expect(result.current.hasCredentials).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.currentPoints).toBe(0)
      expect(api.fetchProgress).not.toHaveBeenCalled()
    })

    it("should return hasCredentials false when nytToken is empty string", async () => {
      vi.mocked(storage.getCredentials).mockReturnValue({
        nytToken: "",
        nytSubscriberId: "test-subscriber-id",
        anthropicKey: "test-key",
      })

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasCredentials).toBe(false)
      expect(api.fetchProgress).not.toHaveBeenCalled()
    })
  })

  describe("with credentials", () => {
    beforeEach(() => {
      vi.mocked(storage.getCredentials).mockReturnValue(mockCredentials)
    })

    it("should start in loading state", () => {
      vi.mocked(api.fetchProgress).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.foundWords).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.hasCredentials).toBe(true)
    })

    it("should fetch progress data on mount", async () => {
      vi.mocked(api.fetchProgress).mockResolvedValue(mockCubbyResponse)

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.foundWords).toEqual(["able", "bale", "placebo"])
      expect(result.current.error).toBeNull()
      expect(result.current.hasCredentials).toBe(true)
      expect(api.fetchProgress).toHaveBeenCalledTimes(1)
      expect(api.fetchProgress).toHaveBeenCalledWith("test-nyt-token", "test-subscriber-id")
    })

    it("should calculate current points correctly", async () => {
      vi.mocked(api.fetchProgress).mockResolvedValue(mockCubbyResponse)

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // able (4 letters) = 1 point
      // bale (4 letters) = 1 point
      // placebo (7 letters, pangram) = 7 + 7 = 14 points
      // Total = 16 points
      expect(result.current.currentPoints).toBe(16)
    })

    it("should handle ApiError with 401 status", async () => {
      const apiError = new api.ApiError("Unauthorized", 401)
      vi.mocked(api.fetchProgress).mockRejectedValue(apiError)

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.foundWords).toEqual([])
      expect(result.current.error).toBe(
        "Invalid or expired NYT token. Please update your credentials.",
      )
    })

    it("should handle ApiError with other status", async () => {
      const apiError = new api.ApiError("Server error", 500)
      vi.mocked(api.fetchProgress).mockRejectedValue(apiError)

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.foundWords).toEqual([])
      expect(result.current.error).toBe("Server error")
    })

    it("should handle generic errors", async () => {
      vi.mocked(api.fetchProgress).mockRejectedValue(new Error("Network error"))

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.foundWords).toEqual([])
      expect(result.current.error).toBe("Network error")
    })

    it("should handle non-Error thrown values", async () => {
      vi.mocked(api.fetchProgress).mockRejectedValue("Unknown error")

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.foundWords).toEqual([])
      expect(result.current.error).toBe("Failed to load progress")
    })

    it("should refetch progress when refetch is called", async () => {
      vi.mocked(api.fetchProgress).mockResolvedValue(mockCubbyResponse)

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.fetchProgress).toHaveBeenCalledTimes(1)

      // Call refetch
      await act(async () => {
        await result.current.refetch()
      })

      expect(api.fetchProgress).toHaveBeenCalledTimes(2)
      expect(result.current.foundWords).toEqual(["able", "bale", "placebo"])
    })

    it("should clear error on successful refetch", async () => {
      // First call fails
      vi.mocked(api.fetchProgress).mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.error).toBe("Network error")
      })

      // Second call succeeds
      vi.mocked(api.fetchProgress).mockResolvedValueOnce(mockCubbyResponse)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.foundWords).toEqual(["able", "bale", "placebo"])
    })

    it("should set loading state during refetch", async () => {
      vi.mocked(api.fetchProgress).mockResolvedValue(mockCubbyResponse)

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Start refetch without awaiting
      let refetchPromise: Promise<void>
      act(() => {
        refetchPromise = result.current.refetch()
      })

      // Should be loading during refetch
      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        await refetchPromise
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe("enabled prop", () => {
    beforeEach(() => {
      vi.mocked(storage.getCredentials).mockReturnValue(mockCredentials)
    })

    it("should not fetch when enabled is false", async () => {
      vi.mocked(api.fetchProgress).mockResolvedValue(mockCubbyResponse)

      const { result } = renderHook(() => useUserProgress(mockPangrams, false))

      // Give it time to potentially fetch
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.foundWords).toEqual([])
      expect(api.fetchProgress).not.toHaveBeenCalled()
    })

    it("should fetch when enabled changes from false to true", async () => {
      vi.mocked(api.fetchProgress).mockResolvedValue(mockCubbyResponse)

      const { result, rerender } = renderHook(
        ({ enabled }) => useUserProgress(mockPangrams, enabled),
        { initialProps: { enabled: false } },
      )

      // Initially not fetching
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(api.fetchProgress).not.toHaveBeenCalled()

      // Enable fetching
      rerender({ enabled: true })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.fetchProgress).toHaveBeenCalledTimes(1)
      expect(result.current.foundWords).toEqual(["able", "bale", "placebo"])
    })
  })

  describe("empty progress", () => {
    beforeEach(() => {
      vi.mocked(storage.getCredentials).mockReturnValue(mockCredentials)
    })

    it("should handle empty words array from API", async () => {
      const emptyResponse: CubbyResponse = {
        response_id: "",
        project_version: "",
        correct: null,
        content: {
          words: [],
        },
      }
      vi.mocked(api.fetchProgress).mockResolvedValue(emptyResponse)

      const { result } = renderHook(() => useUserProgress(mockPangrams))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.foundWords).toEqual([])
      expect(result.current.currentPoints).toBe(0)
      expect(result.current.error).toBeNull()
    })
  })
})
