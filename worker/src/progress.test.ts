import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// We test the handleProgress logic by importing the worker and calling it directly
import worker from "./index"
import type { ApiResponse, CubbyResponse, GameStateResponse } from "./types"

// Type for error responses
type ErrorResponse = ApiResponse<never>

// Type for success responses with cubby data
type SuccessResponse = ApiResponse<CubbyResponse>

describe("handleProgress", () => {
  const mockEnv = {
    HINTS_CACHE: {} as KVNamespace,
  }
  const mockCtx = {} as ExecutionContext

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns 401 when X-NYT-Token header is missing", async () => {
    const request = new Request("http://localhost/progress", {
      method: "GET",
    })

    const response = await worker.fetch(request, mockEnv, mockCtx)
    const data = (await response.json()) as ErrorResponse

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Missing X-NYT-Token header")
  })

  it("returns user progress when NYT token is valid", async () => {
    const mockGameStateResponse: GameStateResponse = {
      game_data: {
        answers: ["loop", "pool", "placebo"],
        isPlayingArchive: false,
        isRevealed: false,
        rank: "Genius",
      },
      puzzle_id: "20035",
      game: "spelling_bee",
      user_id: 12345,
      version: "1",
      timestamp: 1705276800,
      print_date: "2026-01-14",
      schema_version: "0.44.0",
    }

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockGameStateResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const request = new Request("http://localhost/progress", {
      method: "GET",
      headers: {
        "X-NYT-Token": "valid-token",
      },
    })

    const response = await worker.fetch(request, mockEnv, mockCtx)
    const data = (await response.json()) as SuccessResponse

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data?.response_id).toBe("20035")
    expect(data.data?.project_version).toBe("20035")
    expect(data.data?.content.words).toEqual(["loop", "pool", "placebo"])

    // Verify fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith(
      "https://www.nytimes.com/svc/games/state/spelling_bee/latest",
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: "NYT-S=valid-token",
        }),
      }),
    )
  })

  it("returns 401 when NYT token is invalid", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const request = new Request("http://localhost/progress", {
      method: "GET",
      headers: {
        "X-NYT-Token": "invalid-token",
      },
    })

    const response = await worker.fetch(request, mockEnv, mockCtx)
    const data = (await response.json()) as ErrorResponse

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Invalid or expired NYT token")
  })

  it("returns 401 when NYT returns 403 forbidden", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const request = new Request("http://localhost/progress", {
      method: "GET",
      headers: {
        "X-NYT-Token": "expired-token",
      },
    })

    const response = await worker.fetch(request, mockEnv, mockCtx)
    const data = (await response.json()) as ErrorResponse

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe("Invalid or expired NYT token")
  })

  it("returns 502 when NYT API returns server error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Internal Server Error", {
        status: 500,
        statusText: "Internal Server Error",
      }),
    )

    const request = new Request("http://localhost/progress", {
      method: "GET",
      headers: {
        "X-NYT-Token": "valid-token",
      },
    })

    const response = await worker.fetch(request, mockEnv, mockCtx)
    const data = (await response.json()) as ErrorResponse

    expect(response.status).toBe(502)
    expect(data.success).toBe(false)
    expect(data.error).toContain("Failed to fetch user progress")
  })
})
