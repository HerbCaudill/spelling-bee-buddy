import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { buildCacheKey, generateHints } from "./hints"
import type { GameData } from "./types"

describe("hints", () => {
  describe("buildCacheKey", () => {
    it("creates cache key from print date", () => {
      expect(buildCacheKey("2026-01-14")).toBe("hints:v2:2026-01-14")
    })

    it("handles different date formats", () => {
      expect(buildCacheKey("2025-12-31")).toBe("hints:v2:2025-12-31")
      expect(buildCacheKey("2024-01-01")).toBe("hints:v2:2024-01-01")
    })
  })

  describe("generateHints", () => {
    const mockGameData: GameData = {
      today: {
        displayWeekday: "Wednesday",
        displayDate: "January 14, 2026",
        printDate: "2026-01-14",
        centerLetter: "o",
        outerLetters: ["a", "b", "c", "e", "l", "p"],
        validLetters: ["o", "a", "b", "c", "e", "l", "p"],
        pangrams: ["placebo"],
        answers: ["able", "ball", "call", "placebo"],
        id: 20035,
      },
    }

    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it("calls Anthropic API with correct parameters", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              hints: {
                able: "Capable of doing something",
                ball: "Round object for playing",
                call: "Use the phone",
                placebo: "Fake medicine",
              },
            }),
          },
        ],
      }

      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await generateHints(mockGameData, "test-api-key")

      expect(fetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "test-api-key",
            "anthropic-version": "2023-06-01",
          },
        }),
      )

      expect(result.generatedAt).toBeDefined()
      expect(result.hints).toBeDefined()
    })

    it("organizes hints by two-letter prefix", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              hints: {
                able: "Capable of doing something",
                ball: "Round object for playing",
                call: "Use the phone",
                placebo: "Fake medicine",
              },
            }),
          },
        ],
      }

      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await generateHints(mockGameData, "test-api-key")

      // Check that hints are organized by prefix
      expect(result.hints["AB"]).toBeDefined()
      expect(result.hints["BA"]).toBeDefined()
      expect(result.hints["CA"]).toBeDefined()
      expect(result.hints["PL"]).toBeDefined()

      // Check structure of hint entries
      expect(result.hints["AB"][0]).toEqual({
        word: "ABLE",
        hint: "Capable of doing something",
        length: 4,
      })
    })

    it("sorts hints by length within each prefix", async () => {
      const gameDataWithMultipleSamePrefix: GameData = {
        today: {
          ...mockGameData.today,
          answers: ["cab", "cable", "capable"],
          pangrams: [],
        },
      }

      const mockResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              hints: {
                cab: "Taxi",
                cable: "Wire for electricity",
                capable: "Able to do things",
              },
            }),
          },
        ],
      }

      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await generateHints(gameDataWithMultipleSamePrefix, "test-api-key")

      expect(result.hints["CA"]).toHaveLength(3)
      expect(result.hints["CA"][0].length).toBe(3) // cab
      expect(result.hints["CA"][1].length).toBe(5) // cable
      expect(result.hints["CA"][2].length).toBe(7) // capable
    })

    it("throws error on API failure", async () => {
      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      })

      await expect(generateHints(mockGameData, "invalid-key")).rejects.toThrow(
        "Anthropic API error (401): Unauthorized",
      )
    })

    it("handles malformed JSON response gracefully", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: "This is not valid JSON",
          },
        ],
      }

      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await generateHints(mockGameData, "test-api-key")

      // Should create fallback hints
      expect(result.hints["AB"]).toBeDefined()
      expect(result.hints["AB"][0].hint).toBe("4-letter word")
    })

    it("handles JSON wrapped in markdown code blocks", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: '```json\n{"hints": {"able": "Can do", "ball": "Round toy", "call": "Phone", "placebo": "Sugar pill"}}\n```',
          },
        ],
      }

      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await generateHints(mockGameData, "test-api-key")

      expect(result.hints["AB"][0].hint).toBe("Can do")
      expect(result.hints["BA"][0].hint).toBe("Round toy")
    })

    it("handles case-insensitive word matching in response", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              hints: {
                ABLE: "Capable hint",
                Ball: "Ball hint",
                call: "Call hint",
                PLACEBO: "Placebo hint",
              },
            }),
          },
        ],
      }

      ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await generateHints(mockGameData, "test-api-key")

      // Should find hints regardless of case
      expect(result.hints["AB"][0].hint).toBe("Capable hint")
    })
  })
})
