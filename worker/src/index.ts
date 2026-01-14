/**
 * Cloudflare Worker for Spelling Bee Buddy
 *
 * Endpoints:
 * - GET /puzzle        - Fetch today's puzzle data from NYT
 * - GET /progress      - Fetch user's progress (requires X-NYT-Token header)
 * - GET /hints         - Get AI-generated hints (requires X-Anthropic-Key header, uses KV cache)
 */

import type { Env } from "./types"
import { handleCorsPreFlight, errorResponse, jsonResponse } from "./cors"

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
  // TODO: Implement puzzle fetching
  // This will be implemented in a future task:
  // "Implement Worker endpoint to fetch and parse puzzle data from NYT page"
  return errorResponse("Not implemented", 501)
}

/**
 * Fetch user's progress from NYT Cubby API
 * Requires X-NYT-Token header with user's NYT-S cookie value
 */
async function handleProgress(request: Request): Promise<Response> {
  // TODO: Implement progress fetching
  // This will be implemented in a future task:
  // "Implement Worker endpoint to proxy user progress API with auth"
  const nytToken = request.headers.get("X-NYT-Token")
  if (!nytToken) {
    return errorResponse("Missing X-NYT-Token header", 401)
  }

  return errorResponse("Not implemented", 501)
}

/**
 * Get AI-generated hints for the puzzle
 * Checks KV cache first, generates with Anthropic API if not cached
 * Requires X-Anthropic-Key header with user's API key
 */
async function handleHints(request: Request, env: Env): Promise<Response> {
  // TODO: Implement hint generation
  // This will be implemented in a future task:
  // "Implement Worker hint generation with Anthropic API and KV caching"
  const anthropicKey = request.headers.get("X-Anthropic-Key")
  if (!anthropicKey) {
    return errorResponse("Missing X-Anthropic-Key header", 401)
  }

  // Verify KV binding is available
  if (!env.HINTS_CACHE) {
    return errorResponse("KV namespace not configured", 500)
  }

  return errorResponse("Not implemented", 501)
}
