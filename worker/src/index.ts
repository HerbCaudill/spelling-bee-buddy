/**
 * Cloudflare Worker for Spelling Bee Buddy
 *
 * Endpoints:
 * - GET /puzzle        - Fetch today's puzzle data from NYT
 * - GET /progress      - Fetch user's progress (requires X-NYT-Token header)
 * - GET /hints         - Get AI-generated hints (requires X-Anthropic-Key header, uses KV cache)
 */

import type { Env, GameData, CachedHints } from "./types"
import { handleCorsPreFlight, errorResponse, jsonResponse } from "./cors"
import { parseGameData } from "./parser"
import { generateHints, buildCacheKey } from "./hints"

const NYT_SPELLING_BEE_URL = "https://www.nytimes.com/puzzles/spelling-bee"

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCorsPreFlight()
    }

    try {
      switch (path) {
        case "/puzzle":
          return await handlePuzzle()

        case "/progress":
          return await handleProgress(request)

        case "/hints":
          return await handleHints(request, env)

        case "/health":
          return jsonResponse({ success: true, status: "ok" })

        default:
          return errorResponse("Not found", 404)
      }
    } catch (error) {
      console.error("Worker error:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      return errorResponse(message, 500)
    }
  },
}

/**
 * Fetch puzzle data from NYT Spelling Bee page
 * This endpoint parses the page HTML to extract window.gameData
 */
async function handlePuzzle(): Promise<Response> {
  const response = await fetch(NYT_SPELLING_BEE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  })

  if (!response.ok) {
    return errorResponse(
      `Failed to fetch puzzle page: ${response.status} ${response.statusText}`,
      502
    )
  }

  const html = await response.text()
  const gameData = parseGameData(html)

  if (!gameData) {
    return errorResponse("Failed to parse puzzle data from NYT page", 502)
  }

  return jsonResponse({
    success: true,
    data: gameData,
  })
}

const NYT_CUBBY_API_URL =
  "https://www.nytimes.com/svc/int/run/cubby/public-api/v1/responses/latest/spelling-bee-buddy/reader"

/**
 * Fetch user's progress from NYT Cubby API
 * Requires X-NYT-Token header with user's NYT-S cookie value
 */
async function handleProgress(request: Request): Promise<Response> {
  const nytToken = request.headers.get("X-NYT-Token")
  if (!nytToken) {
    return errorResponse("Missing X-NYT-Token header", 401)
  }

  const response = await fetch(NYT_CUBBY_API_URL, {
    headers: {
      Cookie: `NYT-S=${nytToken}`,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return errorResponse("Invalid or expired NYT token", 401)
    }
    return errorResponse(
      `Failed to fetch user progress: ${response.status} ${response.statusText}`,
      502
    )
  }

  const data = await response.json()

  // The Cubby API returns an array; we want the first (and typically only) item
  // If no response exists yet for this puzzle, the array may be empty
  if (!Array.isArray(data) || data.length === 0) {
    // Return empty words array if user hasn't started the puzzle
    return jsonResponse({
      success: true,
      data: {
        response_id: "",
        project_version: "",
        correct: null,
        content: {
          words: [],
        },
      },
    })
  }

  const cubbyResponse = data[0]

  return jsonResponse({
    success: true,
    data: cubbyResponse,
  })
}

/**
 * Get AI-generated hints for the puzzle
 * Checks KV cache first, generates with Anthropic API if not cached
 * Requires X-Anthropic-Key header with user's API key
 */
async function handleHints(request: Request, env: Env): Promise<Response> {
  const anthropicKey = request.headers.get("X-Anthropic-Key")
  if (!anthropicKey) {
    return errorResponse("Missing X-Anthropic-Key header", 401)
  }

  // Verify KV binding is available
  if (!env.HINTS_CACHE) {
    return errorResponse("KV namespace not configured", 500)
  }

  // First, fetch today's puzzle to get the answers and date
  const puzzleResponse = await fetch(NYT_SPELLING_BEE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  })

  if (!puzzleResponse.ok) {
    return errorResponse(
      `Failed to fetch puzzle for hints: ${puzzleResponse.status}`,
      502
    )
  }

  const html = await puzzleResponse.text()
  const gameData = parseGameData(html)

  if (!gameData) {
    return errorResponse("Failed to parse puzzle data for hints", 502)
  }

  const cacheKey = buildCacheKey(gameData.today.printDate)

  // Check KV cache first
  const cached = await env.HINTS_CACHE.get<CachedHints>(cacheKey, "json")
  if (cached) {
    return jsonResponse({
      success: true,
      data: cached,
    })
  }

  // Generate hints using Anthropic API
  try {
    const hints = await generateHints(gameData, anthropicKey)

    // Cache the hints (expire after 7 days - puzzles are daily)
    await env.HINTS_CACHE.put(cacheKey, JSON.stringify(hints), {
      expirationTtl: 60 * 60 * 24 * 7, // 7 days in seconds
    })

    return jsonResponse({
      success: true,
      data: hints,
    })
  } catch (error) {
    console.error("Error generating hints:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return errorResponse(`Failed to generate hints: ${message}`, 500)
  }
}
