import { describe, it, expect } from "vitest"
import {
  corsHeaders,
  handleCorsPreFlight,
  withCors,
  jsonResponse,
  errorResponse,
} from "./cors"

describe("cors", () => {
  describe("corsHeaders", () => {
    it("allows all origins", () => {
      expect(corsHeaders["Access-Control-Allow-Origin"]).toBe("*")
    })

    it("allows required HTTP methods", () => {
      expect(corsHeaders["Access-Control-Allow-Methods"]).toBe(
        "GET, POST, OPTIONS"
      )
    })

    it("allows required custom headers", () => {
      const allowedHeaders = corsHeaders["Access-Control-Allow-Headers"]
      expect(allowedHeaders).toContain("Content-Type")
      expect(allowedHeaders).toContain("X-NYT-Token")
      expect(allowedHeaders).toContain("X-Anthropic-Key")
    })

    it("sets preflight cache max age", () => {
      expect(corsHeaders["Access-Control-Max-Age"]).toBe("86400")
    })
  })

  describe("handleCorsPreFlight", () => {
    it("returns 204 status", () => {
      const response = handleCorsPreFlight()
      expect(response.status).toBe(204)
    })

    it("includes all CORS headers", () => {
      const response = handleCorsPreFlight()
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, OPTIONS"
      )
      expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
        "X-NYT-Token"
      )
    })

    it("has no body", () => {
      const response = handleCorsPreFlight()
      expect(response.body).toBeNull()
    })
  })

  describe("withCors", () => {
    it("adds CORS headers to existing response", () => {
      const original = new Response("test body", {
        status: 200,
        headers: { "X-Custom": "value" },
      })
      const corsified = withCors(original)

      expect(corsified.headers.get("Access-Control-Allow-Origin")).toBe("*")
      expect(corsified.headers.get("X-Custom")).toBe("value")
    })

    it("preserves original status code", () => {
      const original = new Response(null, { status: 404 })
      const corsified = withCors(original)
      expect(corsified.status).toBe(404)
    })

    it("preserves original status text", () => {
      const original = new Response(null, {
        status: 404,
        statusText: "Not Found",
      })
      const corsified = withCors(original)
      expect(corsified.statusText).toBe("Not Found")
    })
  })

  describe("jsonResponse", () => {
    it("returns JSON content type", () => {
      const response = jsonResponse({ test: "data" })
      expect(response.headers.get("Content-Type")).toBe("application/json")
    })

    it("includes CORS headers", () => {
      const response = jsonResponse({ test: "data" })
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("defaults to 200 status", () => {
      const response = jsonResponse({ test: "data" })
      expect(response.status).toBe(200)
    })

    it("allows custom status code", () => {
      const response = jsonResponse({ test: "data" }, 201)
      expect(response.status).toBe(201)
    })

    it("serializes data as JSON", async () => {
      const data = { key: "value", number: 42 }
      const response = jsonResponse(data)
      const body = await response.json()
      expect(body).toEqual(data)
    })
  })

  describe("errorResponse", () => {
    it("returns success: false", async () => {
      const response = errorResponse("Something went wrong")
      const body = (await response.json()) as { success: boolean; error: string }
      expect(body.success).toBe(false)
    })

    it("includes error message", async () => {
      const response = errorResponse("Something went wrong")
      const body = (await response.json()) as { success: boolean; error: string }
      expect(body.error).toBe("Something went wrong")
    })

    it("defaults to 500 status", () => {
      const response = errorResponse("Error")
      expect(response.status).toBe(500)
    })

    it("allows custom status code", () => {
      const response = errorResponse("Not found", 404)
      expect(response.status).toBe(404)
    })

    it("includes CORS headers", () => {
      const response = errorResponse("Error")
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })
  })
})
