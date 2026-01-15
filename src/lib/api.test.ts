import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fetchPuzzle, fetchProgress, fetchHints, checkHealth, getWorkerUrl, ApiError } from "./api"
import type { GameData, CubbyResponse, CachedHints } from "@/types"

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("api", () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("fetchPuzzle", () => {
    const mockGameData: GameData = {
      today: {
        displayWeekday: "Wednesday",
        displayDate: "January 14, 2026",
        printDate: "2026-01-14",
        centerLetter: "o",
        outerLetters: ["a", "b", "c", "e", "l", "p"],
        validLetters: ["o", "a", "b", "c", "e", "l", "p"],
        pangrams: ["placebo"],
        answers: ["able", "bale", "opal", "placebo"],
        id: 20035,
      },
    }

    it("should fetch puzzle data successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockGameData }),
      })

      const result = await fetchPuzzle()

      expect(result).toEqual(mockGameData)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/puzzle"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      )
    })

    it("should throw ApiError on failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({
          success: false,
          error: "Failed to fetch puzzle page",
        }),
      })

      await expect(fetchPuzzle()).rejects.toThrow(ApiError)
      await expect(fetchPuzzle()).rejects.toThrow("Failed to fetch puzzle page")
    })

    it("should throw ApiError when success is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: "Parse error",
        }),
      })

      await expect(fetchPuzzle()).rejects.toThrow("Parse error")
    })

    it("should throw ApiError when data is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await expect(fetchPuzzle()).rejects.toThrow("Response missing data")
    })
  })

  describe("fetchProgress", () => {
    const mockCubbyResponse: CubbyResponse = {
      response_id: "abc123",
      project_version: "20035",
      correct: null,
      content: {
        words: ["able", "bale"],
      },
    }

    it("should fetch progress with NYT token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockCubbyResponse }),
      })

      const result = await fetchProgress("my-nyt-token")

      expect(result).toEqual(mockCubbyResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/progress"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-NYT-Token": "my-nyt-token",
          }),
        }),
      )
    })

    it("should throw ApiError when unauthorized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: "Missing X-NYT-Token header",
        }),
      })

      const error = await fetchProgress("invalid-token").catch(e => e)
      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(401)
    })
  })

  describe("fetchHints", () => {
    const mockHints: CachedHints = {
      generatedAt: "2026-01-14T10:00:00Z",
      hints: {
        AB: [
          { hint: "Having the necessary skills", length: 4 },
          { hint: "A bundle of hay", length: 4 },
        ],
      },
    }

    it("should fetch hints with Anthropic key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockHints }),
      })

      const result = await fetchHints("my-anthropic-key")

      expect(result).toEqual(mockHints)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/hints"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Anthropic-Key": "my-anthropic-key",
          }),
        }),
      )
    })

    it("should throw ApiError when unauthorized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: "Missing X-Anthropic-Key header",
        }),
      })

      const error = await fetchHints("invalid-key").catch(e => e)
      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(401)
    })
  })

  describe("checkHealth", () => {
    it("should return true when Worker is healthy", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { status: "ok" } }),
      })

      const result = await checkHealth()
      expect(result).toBe(true)
    })

    it("should return false when Worker is down", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      const result = await checkHealth()
      expect(result).toBe(false)
    })

    it("should return false when Worker returns error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: "Internal error" }),
      })

      const result = await checkHealth()
      expect(result).toBe(false)
    })
  })

  describe("getWorkerUrl", () => {
    it("should return a string URL", () => {
      const url = getWorkerUrl()
      expect(typeof url).toBe("string")
      expect(url.length).toBeGreaterThan(0)
    })
  })

  describe("ApiError", () => {
    it("should have correct name and properties", () => {
      const error = new ApiError("Test error", 404)
      expect(error.name).toBe("ApiError")
      expect(error.message).toBe("Test error")
      expect(error.status).toBe(404)
    })

    it("should be instanceof Error", () => {
      const error = new ApiError("Test error", 500)
      expect(error).toBeInstanceOf(Error)
    })
  })
})
