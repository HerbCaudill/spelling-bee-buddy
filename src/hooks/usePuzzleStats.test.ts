import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { usePuzzleStats } from "./usePuzzleStats"
import * as api from "@/lib/api"
import type { PuzzleStats } from "@/types"

// Mock the api module
vi.mock("@/lib/api", () => ({
  fetchPuzzleStats: vi.fn(),
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

const mockStats: PuzzleStats = {
  id: 12345,
  answers: {
    able: 9000,
    about: 8000,
    apple: 5000,
    axle: 1000,
  },
  n: 10000,
  numberOfUsers: 10000,
}

describe("usePuzzleStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("initial fetch", () => {
    it("should start in loading state", () => {
      vi.mocked(api.fetchPuzzleStats).mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => usePuzzleStats(12345))

      expect(result.current.isLoading).toBe(true)
      expect(result.current.stats).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.notAvailableYet).toBe(false)
    })

    it("should fetch stats on mount", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.error).toBeNull()
      expect(result.current.notAvailableYet).toBe(false)
      expect(api.fetchPuzzleStats).toHaveBeenCalledTimes(1)
      expect(api.fetchPuzzleStats).toHaveBeenCalledWith(12345)
    })

    it("should not fetch when puzzleId is null", async () => {
      const { result } = renderHook(() => usePuzzleStats(null))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.stats).toBeNull()
      expect(api.fetchPuzzleStats).not.toHaveBeenCalled()
    })

    it("should not fetch when enabled is false", async () => {
      const { result } = renderHook(() => usePuzzleStats(12345, { enabled: false }))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.stats).toBeNull()
      expect(api.fetchPuzzleStats).not.toHaveBeenCalled()
    })
  })

  describe("404 handling (not available yet)", () => {
    it("should set notAvailableYet when API returns 404", async () => {
      const apiError = new api.ApiError("Stats not found for puzzle 12345", 404)
      vi.mocked(api.fetchPuzzleStats).mockRejectedValue(apiError)

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats).toBeNull()
      expect(result.current.notAvailableYet).toBe(true)
      expect(result.current.error).toBeNull() // 404 is not an error, just "not available yet"
    })

    it("should clear notAvailableYet when stats become available", async () => {
      const apiError = new api.ApiError("Stats not found for puzzle 12345", 404)
      vi.mocked(api.fetchPuzzleStats).mockRejectedValue(apiError)

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      await waitFor(() => {
        expect(result.current.notAvailableYet).toBe(true)
      })

      // Now stats become available
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.notAvailableYet).toBe(false)
    })
  })

  describe("error handling", () => {
    it("should handle ApiError with non-404 status", async () => {
      const apiError = new api.ApiError("Server error", 500)
      vi.mocked(api.fetchPuzzleStats).mockRejectedValue(apiError)

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats).toBeNull()
      expect(result.current.error).toBe("Server error")
      expect(result.current.notAvailableYet).toBe(false)
    })

    it("should handle generic errors", async () => {
      vi.mocked(api.fetchPuzzleStats).mockRejectedValue(new Error("Network error"))

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats).toBeNull()
      expect(result.current.error).toBe("Network error")
    })

    it("should handle non-Error thrown values", async () => {
      vi.mocked(api.fetchPuzzleStats).mockRejectedValue("Unknown error")

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stats).toBeNull()
      expect(result.current.error).toBe("Failed to load puzzle stats")
    })
  })

  describe("refetch", () => {
    it("should refetch stats when refetch is called", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.fetchPuzzleStats).toHaveBeenCalledTimes(1)

      await act(async () => {
        await result.current.refetch()
      })

      expect(api.fetchPuzzleStats).toHaveBeenCalledTimes(2)
      expect(result.current.stats).toEqual(mockStats)
    })

    it("should set loading state during refetch", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

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

    it("should clear error on successful refetch", async () => {
      // First call fails
      vi.mocked(api.fetchPuzzleStats).mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      await waitFor(() => {
        expect(result.current.error).toBe("Network error")
      })

      // Second call succeeds
      vi.mocked(api.fetchPuzzleStats).mockResolvedValueOnce(mockStats)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.stats).toEqual(mockStats)
    })
  })

  describe("polling", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should poll at default interval (2 minutes)", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      renderHook(() => usePuzzleStats(12345))

      // Initial fetch
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })

      const initialCallCount = api.fetchPuzzleStats.mock.calls.length

      // Advance time by just under 2 minutes - should not poll yet
      await act(async () => {
        vi.advanceTimersByTime(2 * 60 * 1000 - 100)
      })

      expect(api.fetchPuzzleStats.mock.calls.length).toBe(initialCallCount)

      // Advance time to trigger the poll
      await act(async () => {
        vi.advanceTimersByTime(100)
        await vi.runOnlyPendingTimersAsync()
      })

      // Should have polled at least once
      expect(api.fetchPuzzleStats.mock.calls.length).toBeGreaterThan(initialCallCount)
    })

    it("should poll faster when notAvailableYet is true (30 seconds)", async () => {
      const apiError = new api.ApiError("Stats not found", 404)
      vi.mocked(api.fetchPuzzleStats).mockRejectedValue(apiError)

      renderHook(() => usePuzzleStats(12345))

      // Initial fetch
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })

      const initialCallCount = api.fetchPuzzleStats.mock.calls.length

      // Advance time by just under 30 seconds - should not poll yet
      await act(async () => {
        vi.advanceTimersByTime(30 * 1000 - 100)
      })

      expect(api.fetchPuzzleStats.mock.calls.length).toBe(initialCallCount)

      // Advance time to trigger the poll
      await act(async () => {
        vi.advanceTimersByTime(100)
        await vi.runOnlyPendingTimersAsync()
      })

      // Should have polled at least once
      expect(api.fetchPuzzleStats.mock.calls.length).toBeGreaterThan(initialCallCount)
    })

    it("should use custom pollInterval", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      renderHook(() => usePuzzleStats(12345, { pollInterval: 60 * 1000 })) // 1 minute

      // Initial fetch
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })

      const initialCallCount = api.fetchPuzzleStats.mock.calls.length

      // Advance time by just under 1 minute - should not poll yet
      await act(async () => {
        vi.advanceTimersByTime(60 * 1000 - 100)
      })

      expect(api.fetchPuzzleStats.mock.calls.length).toBe(initialCallCount)

      // Advance time to trigger the poll
      await act(async () => {
        vi.advanceTimersByTime(100)
        await vi.runOnlyPendingTimersAsync()
      })

      // Should have polled at least once
      expect(api.fetchPuzzleStats.mock.calls.length).toBeGreaterThan(initialCallCount)
    })

    it("should disable polling when pollInterval is 0", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      renderHook(() => usePuzzleStats(12345, { pollInterval: 0 }))

      // Initial fetch
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })

      expect(api.fetchPuzzleStats).toHaveBeenCalledTimes(1)

      // Advance time significantly
      await act(async () => {
        vi.advanceTimersByTime(10 * 60 * 1000) // 10 minutes
        await vi.runOnlyPendingTimersAsync()
      })

      // Should not have polled
      expect(api.fetchPuzzleStats).toHaveBeenCalledTimes(1)
    })

    it("should not show loading state during background polling", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      const { result } = renderHook(() => usePuzzleStats(12345))

      // Initial fetch
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.stats).toEqual(mockStats)

      // Advance time to trigger polling
      await act(async () => {
        vi.advanceTimersByTime(2 * 60 * 1000)
        await vi.runOnlyPendingTimersAsync()
      })

      // Should not be in loading state during background polling
      expect(result.current.isLoading).toBe(false)
      expect(result.current.stats).toEqual(mockStats)
    })

    it("should keep existing stats during polling errors", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      const { result } = renderHook(() => usePuzzleStats(12345))

      // Initial fetch
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })

      expect(result.current.stats).toEqual(mockStats)

      // Next poll fails
      vi.mocked(api.fetchPuzzleStats).mockRejectedValue(new Error("Network error"))

      // Advance time to trigger polling
      await act(async () => {
        vi.advanceTimersByTime(2 * 60 * 1000)
        await vi.runOnlyPendingTimersAsync()
      })

      // Should still have the old stats
      expect(result.current.stats).toEqual(mockStats)
    })

    it("should stop polling when puzzleId becomes null", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      const { result, rerender } = renderHook(({ id }) => usePuzzleStats(id), {
        initialProps: { id: 12345 as number | null },
      })

      // Initial fetch
      await act(async () => {
        await vi.runOnlyPendingTimersAsync()
      })

      const initialCallCount = api.fetchPuzzleStats.mock.calls.length

      // Change puzzleId to null
      rerender({ id: null })

      // Advance time significantly
      await act(async () => {
        vi.advanceTimersByTime(10 * 60 * 1000)
        await vi.runOnlyPendingTimersAsync()
      })

      // Should not have polled after setting puzzleId to null
      expect(api.fetchPuzzleStats).toHaveBeenCalledTimes(initialCallCount)
      expect(result.current.stats).toBeNull()
    })
  })

  describe("puzzleId changes", () => {
    it("should refetch when puzzleId changes", async () => {
      vi.mocked(api.fetchPuzzleStats).mockResolvedValue(mockStats)

      const { rerender } = renderHook(({ id }) => usePuzzleStats(id, { pollInterval: 0 }), {
        initialProps: { id: 12345 },
      })

      await waitFor(() => {
        expect(api.fetchPuzzleStats).toHaveBeenCalledTimes(1)
      })

      // Change puzzleId
      rerender({ id: 67890 })

      await waitFor(() => {
        expect(api.fetchPuzzleStats).toHaveBeenCalledTimes(2)
      })

      expect(api.fetchPuzzleStats).toHaveBeenLastCalledWith(67890)
    })
  })
})
