import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// We test the handleProgress logic by importing the worker and calling it directly
import worker from "./index"
import type { ApiResponse, CubbyResponse } from "./types"

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
    const mockCubbyResponse = [
      {
        response_id: "12345",
        project_version: "20035",
        correct: null,
        content: {
          words: ["loop", "pool", "placebo"],
        },
      },
    ]

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockCubbyResponse), {
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
    expect(data.data?.response_id).toBe("12345")
    expect(data.data?.project_version).toBe("20035")
    expect(data.data?.content.words).toEqual(["loop", "pool", "placebo"])

    // Verify fetch was called with correct parameters
    expect(fetch).toHaveBeenCalledWith(
      "https://www.nytimes.com/svc/int/run/cubby/public-api/v1/responses/latest/spelling-bee-buddy/reader",
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: "NYT-S=valid-token",
        }),
      }),
    )
  })

  it("returns empty words array when user has no progress", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), {
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
    expect(data.data?.content.words).toEqual([])
    expect(data.data?.response_id).toBe("")
    expect(data.data?.project_version).toBe("")
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
