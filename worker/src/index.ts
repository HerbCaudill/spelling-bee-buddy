/**
 * Cloudflare Worker for Spelling Bee Buddy
 *
 * Endpoints:
 * - GET /puzzle        - Fetch today's puzzle data from NYT
 * - GET /active        - Fetch this week's and last week's puzzles
 * - GET /stats/:id     - Fetch stats for a puzzle (how many players found each word)
 * - GET /progress      - Fetch user's progress (requires X-NYT-Token header)
 * - GET /hints         - Get AI-generated hints (requires X-Anthropic-Key header, optional puzzleId query param)
 */

import type {
  Env,
  GameData,
  CachedHints,
  ActivePuzzlesResponse,
  PuzzleStats,
  GameStateResponse,
} from "./types"
import { handleCorsPreFlight, errorResponse, jsonResponse } from "./cors"
import { parseGameData } from "./parser"
import { generateHints, buildCacheKey } from "./hints"

const NYT_SPELLING_BEE_URL = "https://www.nytimes.com/puzzles/spelling-bee"
const NYT_ACTIVE_PUZZLES_URL = "https://www.nytimes.com/svc/spelling-bee/v1/active.json"
const NYT_GAME_STATE_URL = "https://www.nytimes.com/svc/games/state/spelling_bee"
const NYT_STATS_BASE_URL =
  "https://static01.nyt.com/newsgraphics/2023-01-18-spelling-bee-buddy/stats"

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCorsPreFlight()
    }

    try {
      // Handle /stats/:id route
      const statsMatch = path.match(/^\/stats\/(\d+)$/)
      if (statsMatch) {
        return await handleStats(parseInt(statsMatch[1], 10))
      }

      switch (path) {
        case "/puzzle":
          return await handlePuzzle()

        case "/active":
          return await handleActive()

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
      502,
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

/**
 * Fetch user's progress from NYT games state API
 * Requires X-NYT-Token header with user's NYT-S cookie value
 * Optionally accepts puzzleId query parameter to get progress for a specific puzzle
 */
async function handleProgress(request: Request): Promise<Response> {
  const nytToken = request.headers.get("X-NYT-Token")
  if (!nytToken) {
    return errorResponse("Missing X-NYT-Token header", 401)
  }

  // Check for optional puzzleId query parameter
  const url = new URL(request.url)
  const puzzleIdParam = url.searchParams.get("puzzleId")

  // Build the appropriate URL: always use /latest endpoint with optional puzzle_id query param
  const stateUrl =
    puzzleIdParam ?
      `${NYT_GAME_STATE_URL}/latest?puzzle_id=${puzzleIdParam}`
    : `${NYT_GAME_STATE_URL}/latest`

  const response = await fetch(stateUrl, {
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
    // 404 means user hasn't started this puzzle yet
    if (response.status === 404) {
      // Return empty progress for puzzles not yet started
      return jsonResponse({
        success: true,
        data: {
          response_id: puzzleIdParam || "unknown",
          project_version: puzzleIdParam || "unknown",
          correct: null,
          content: {
            words: [],
          },
        },
      })
    }
    return errorResponse(
      `Failed to fetch user progress: ${response.status} ${response.statusText}`,
      502,
    )
  }

  const gameState: GameStateResponse = await response.json()

  // Transform to CubbyResponse format for backwards compatibility with frontend
  return jsonResponse({
    success: true,
    data: {
      response_id: gameState.puzzle_id,
      project_version: gameState.puzzle_id,
      correct: null,
      content: {
        words: gameState.game_data.answers,
      },
    },
  })
}

/**
 * Get AI-generated hints for a puzzle
 * Checks KV cache first, generates with Anthropic API if not cached
 * Requires X-Anthropic-Key header with user's API key
 * Accepts optional puzzleId query parameter to get hints for a specific puzzle
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

  // Check for optional puzzleId query parameter
  const url = new URL(request.url)
  const puzzleIdParam = url.searchParams.get("puzzleId")

  let gameData: GameData

  if (puzzleIdParam) {
    // Fetch the specific puzzle from active puzzles
    const activePuzzles = await fetchActivePuzzlesInternal()
    if (!activePuzzles) {
      return errorResponse("Failed to fetch active puzzles", 502)
    }

    const puzzle = activePuzzles.puzzles.find(p => p.id === parseInt(puzzleIdParam, 10))
    if (!puzzle) {
      return errorResponse(`Puzzle ${puzzleIdParam} not found in active puzzles`, 404)
    }

    // Convert ActivePuzzle to GameData format
    gameData = {
      today: {
        displayWeekday: "", // Not needed for hints
        displayDate: "", // Not needed for hints
        printDate: puzzle.print_date,
        centerLetter: puzzle.center_letter,
        outerLetters: puzzle.outer_letters.split(""),
        validLetters: [puzzle.center_letter, ...puzzle.outer_letters.split("")],
        pangrams: puzzle.pangrams,
        answers: puzzle.answers,
        id: puzzle.id,
      },
    }
  } else {
    // Fetch today's puzzle to get the answers and date
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
      return errorResponse(`Failed to fetch puzzle for hints: ${puzzleResponse.status}`, 502)
    }

    const html = await puzzleResponse.text()
    const parsedData = parseGameData(html)

    if (!parsedData) {
      return errorResponse("Failed to parse puzzle data for hints", 502)
    }
    gameData = parsedData
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

/**
 * Internal helper to fetch active puzzles
 */
async function fetchActivePuzzlesInternal(): Promise<ActivePuzzlesResponse | null> {
  const response = await fetch(NYT_ACTIVE_PUZZLES_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    return null
  }

  return response.json()
}

/**
 * Fetch the list of active puzzles (this week and last week)
 */
async function handleActive(): Promise<Response> {
  const response = await fetch(NYT_ACTIVE_PUZZLES_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    return errorResponse(
      `Failed to fetch active puzzles: ${response.status} ${response.statusText}`,
      502,
    )
  }

  const data: ActivePuzzlesResponse = await response.json()

  return jsonResponse({
    success: true,
    data,
  })
}

/**
 * Fetch stats for a specific puzzle (how many players found each word)
 */
async function handleStats(puzzleId: number): Promise<Response> {
  const response = await fetch(`${NYT_STATS_BASE_URL}/${puzzleId}.json`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return errorResponse(`Stats not found for puzzle ${puzzleId}`, 404)
    }
    return errorResponse(`Failed to fetch stats: ${response.status} ${response.statusText}`, 502)
  }

  const data: PuzzleStats = await response.json()

  return jsonResponse({
    success: true,
    data,
  })
}
