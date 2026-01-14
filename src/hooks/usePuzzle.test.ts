import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { usePuzzle } from "./usePuzzle"
import * as api from "@/lib/api"
import type { GameData } from "@/types"

// Mock the api module
vi.mock("@/lib/api", () => ({
  fetchPuzzle: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number
    ) {
      super(message)
      this.name = "ApiError"
    }
  },
}))

const mockPuzzle: GameData = {
  today: {
    displayWeekday: "Wednesday",
    displayDate: "January 14, 2026",
    printDate: "2026-01-14",
    centerLetter: "o",
    outerLetters: ["a", "b", "c", "e", "l", "p"],
    validLetters: ["o", "a", "b", "c", "e", "l", "p"],
    pangrams: ["placebo"],
    answers: ["able", "bale", "lobe", "placebo"], // 1 + 1 + 1 + 7+7 = 17 points
    id: 20035,
  },
}

describe("usePuzzle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should start in loading state", () => {
    vi.mocked(api.fetchPuzzle).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => usePuzzle())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.puzzle).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.maxPoints).toBe(0)
  })

  it("should fetch puzzle data on mount", async () => {
    vi.mocked(api.fetchPuzzle).mockResolvedValue(mockPuzzle)

    const { result } = renderHook(() => usePuzzle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.puzzle).toEqual(mockPuzzle)
    expect(result.current.error).toBeNull()
    expect(api.fetchPuzzle).toHaveBeenCalledTimes(1)
  })

  it("should calculate max points correctly", async () => {
    vi.mocked(api.fetchPuzzle).mockResolvedValue(mockPuzzle)

    const { result } = renderHook(() => usePuzzle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // able (4 letters) = 1 point
    // bale (4 letters) = 1 point
    // lobe (4 letters) = 1 point
    // placebo (7 letters, pangram) = 7 + 7 = 14 points
    // Total = 17 points
    expect(result.current.maxPoints).toBe(17)
  })

  it("should handle ApiError", async () => {
    const apiError = new api.ApiError("Puzzle not found", 404)
    vi.mocked(api.fetchPuzzle).mockRejectedValue(apiError)

    const { result } = renderHook(() => usePuzzle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.puzzle).toBeNull()
    expect(result.current.error).toBe("Puzzle not found")
    expect(result.current.maxPoints).toBe(0)
  })

  it("should handle generic errors", async () => {
    vi.mocked(api.fetchPuzzle).mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => usePuzzle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.puzzle).toBeNull()
    expect(result.current.error).toBe("Network error")
  })

  it("should handle non-Error thrown values", async () => {
    vi.mocked(api.fetchPuzzle).mockRejectedValue("Unknown error")

    const { result } = renderHook(() => usePuzzle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.puzzle).toBeNull()
    expect(result.current.error).toBe("Failed to load puzzle")
  })

  it("should refetch puzzle data when refetch is called", async () => {
    vi.mocked(api.fetchPuzzle).mockResolvedValue(mockPuzzle)

    const { result } = renderHook(() => usePuzzle())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(api.fetchPuzzle).toHaveBeenCalledTimes(1)

    // Call refetch
    await act(async () => {
      await result.current.refetch()
    })

    expect(api.fetchPuzzle).toHaveBeenCalledTimes(2)
    expect(result.current.puzzle).toEqual(mockPuzzle)
  })

  it("should clear error on successful refetch", async () => {
    // First call fails
    vi.mocked(api.fetchPuzzle).mockRejectedValueOnce(new Error("Network error"))

    const { result } = renderHook(() => usePuzzle())

    await waitFor(() => {
      expect(result.current.error).toBe("Network error")
    })

    // Second call succeeds
    vi.mocked(api.fetchPuzzle).mockResolvedValueOnce(mockPuzzle)

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.puzzle).toEqual(mockPuzzle)
  })

  it("should set loading state during refetch", async () => {
    vi.mocked(api.fetchPuzzle).mockResolvedValue(mockPuzzle)

    const { result } = renderHook(() => usePuzzle())

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
