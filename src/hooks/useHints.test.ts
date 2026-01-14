import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useHints } from "./useHints"
import * as api from "@/lib/api"
import * as storage from "@/lib/storage"
import type { CachedHints, UserCredentials } from "@/types"

// Mock the api module
vi.mock("@/lib/api", () => ({
  fetchHints: vi.fn(),
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
  anthropicKey: "test-anthropic-key",
}

const mockCachedHints: CachedHints = {
  generatedAt: "2026-01-14T12:00:00.000Z",
  hints: {
    ab: [
      { hint: "Having the skill or means to do something", length: 4 },
      { hint: "A rounded bundle of dried grass", length: 4 },
    ],
    pl: [
      {
        hint: "A medicine that provides no real benefit but may make you feel better",
        length: 7,
      },
    ],
    lo: [{ hint: "A rounded projecting part, especially of the ear", length: 4 }],
  },
}

describe("useHints", () => {
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

    it("should return null hints when no credentials", async () => {
      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hints).toBeNull()
      expect(result.current.generatedAt).toBeNull()
      expect(result.current.hasApiKey).toBe(false)
      expect(result.current.error).toBeNull()
      expect(api.fetchHints).not.toHaveBeenCalled()
    })

    it("should return hasApiKey false when anthropicKey is empty string", async () => {
      vi.mocked(storage.getCredentials).mockReturnValue({
        nytToken: "test-token",
        anthropicKey: "",
      })

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasApiKey).toBe(false)
      expect(api.fetchHints).not.toHaveBeenCalled()
    })
  })

  describe("with credentials", () => {
    beforeEach(() => {
      vi.mocked(storage.getCredentials).mockReturnValue(mockCredentials)
    })

    it("should start in loading state", () => {
      vi.mocked(api.fetchHints).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      )

      const { result } = renderHook(() => useHints())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.hints).toBeNull()
      expect(result.current.generatedAt).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.hasApiKey).toBe(true)
    })

    it("should fetch hints on mount", async () => {
      vi.mocked(api.fetchHints).mockResolvedValue(mockCachedHints)

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hints).toEqual(mockCachedHints.hints)
      expect(result.current.generatedAt).toBe("2026-01-14T12:00:00.000Z")
      expect(result.current.error).toBeNull()
      expect(result.current.hasApiKey).toBe(true)
      expect(api.fetchHints).toHaveBeenCalledTimes(1)
      expect(api.fetchHints).toHaveBeenCalledWith("test-anthropic-key")
    })

    it("should handle ApiError with 401 status", async () => {
      const apiError = new api.ApiError("Unauthorized", 401)
      vi.mocked(api.fetchHints).mockRejectedValue(apiError)

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hints).toBeNull()
      expect(result.current.generatedAt).toBeNull()
      expect(result.current.error).toBe(
        "Invalid Anthropic API key. Please update your credentials.",
      )
    })

    it("should handle ApiError with other status", async () => {
      const apiError = new api.ApiError("Server error", 500)
      vi.mocked(api.fetchHints).mockRejectedValue(apiError)

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hints).toBeNull()
      expect(result.current.generatedAt).toBeNull()
      expect(result.current.error).toBe("Server error")
    })

    it("should handle generic errors", async () => {
      vi.mocked(api.fetchHints).mockRejectedValue(new Error("Network error"))

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hints).toBeNull()
      expect(result.current.generatedAt).toBeNull()
      expect(result.current.error).toBe("Network error")
    })

    it("should handle non-Error thrown values", async () => {
      vi.mocked(api.fetchHints).mockRejectedValue("Unknown error")

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hints).toBeNull()
      expect(result.current.generatedAt).toBeNull()
      expect(result.current.error).toBe("Failed to load hints")
    })

    it("should refetch hints when refetch is called", async () => {
      vi.mocked(api.fetchHints).mockResolvedValue(mockCachedHints)

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.fetchHints).toHaveBeenCalledTimes(1)

      // Call refetch
      await act(async () => {
        await result.current.refetch()
      })

      expect(api.fetchHints).toHaveBeenCalledTimes(2)
      expect(result.current.hints).toEqual(mockCachedHints.hints)
    })

    it("should clear error on successful refetch", async () => {
      // First call fails
      vi.mocked(api.fetchHints).mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.error).toBe("Network error")
      })

      // Second call succeeds
      vi.mocked(api.fetchHints).mockResolvedValueOnce(mockCachedHints)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.hints).toEqual(mockCachedHints.hints)
      expect(result.current.generatedAt).toBe("2026-01-14T12:00:00.000Z")
    })

    it("should set loading state during refetch", async () => {
      vi.mocked(api.fetchHints).mockResolvedValue(mockCachedHints)

      const { result } = renderHook(() => useHints())

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
      vi.mocked(api.fetchHints).mockResolvedValue(mockCachedHints)

      const { result } = renderHook(() => useHints(false))

      // Give it time to potentially fetch
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.hints).toBeNull()
      expect(api.fetchHints).not.toHaveBeenCalled()
    })

    it("should fetch when enabled changes from false to true", async () => {
      vi.mocked(api.fetchHints).mockResolvedValue(mockCachedHints)

      const { result, rerender } = renderHook(({ enabled }) => useHints(enabled), {
        initialProps: { enabled: false },
      })

      // Initially not fetching
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(api.fetchHints).not.toHaveBeenCalled()

      // Enable fetching
      rerender({ enabled: true })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.fetchHints).toHaveBeenCalledTimes(1)
      expect(result.current.hints).toEqual(mockCachedHints.hints)
    })
  })

  describe("empty hints", () => {
    beforeEach(() => {
      vi.mocked(storage.getCredentials).mockReturnValue(mockCredentials)
    })

    it("should handle empty hints object from API", async () => {
      const emptyHints: CachedHints = {
        generatedAt: "2026-01-14T12:00:00.000Z",
        hints: {},
      }
      vi.mocked(api.fetchHints).mockResolvedValue(emptyHints)

      const { result } = renderHook(() => useHints())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hints).toEqual({})
      expect(result.current.generatedAt).toBe("2026-01-14T12:00:00.000Z")
      expect(result.current.error).toBeNull()
    })
  })
})
