/**
 * CORS headers for cross-origin requests from the frontend
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-NYT-Token, X-NYT-Subscriber-ID, X-Anthropic-Key",
  "Access-Control-Max-Age": "86400",
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

/**
 * Add CORS headers to a response
 */
export function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers)
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  })
}

/**
 * Create an error response with CORS headers
 */
export function errorResponse(message: string, status: number = 500): Response {
  return jsonResponse({ success: false, error: message }, status)
}
