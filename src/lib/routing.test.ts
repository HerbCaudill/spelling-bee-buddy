import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { isValidDateFormat, getDateFromUrl, getTodayDate, updateUrl } from "./routing"

describe("isValidDateFormat", () => {
  it("accepts valid dates", () => {
    expect(isValidDateFormat("2026-01-15")).toBe(true)
    expect(isValidDateFormat("2026-12-31")).toBe(true)
    expect(isValidDateFormat("2025-02-28")).toBe(true)
  })

  it("rejects invalid formats", () => {
    expect(isValidDateFormat("")).toBe(false)
    expect(isValidDateFormat("2026-1-15")).toBe(false)
    expect(isValidDateFormat("01-15-2026")).toBe(false)
    expect(isValidDateFormat("20260115")).toBe(false)
    expect(isValidDateFormat("not-a-date")).toBe(false)
  })

  it("rejects impossible dates", () => {
    expect(isValidDateFormat("2026-02-30")).toBe(false)
    expect(isValidDateFormat("2026-13-01")).toBe(false)
    expect(isValidDateFormat("2026-00-01")).toBe(false)
    expect(isValidDateFormat("2025-02-29")).toBe(false) // 2025 is not a leap year
  })

  it("accepts leap year dates", () => {
    expect(isValidDateFormat("2024-02-29")).toBe(true) // 2024 is a leap year
  })
})

describe("getDateFromUrl", () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Override window.location.pathname
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    })
  })

  it("extracts date from valid path", () => {
    Object.defineProperty(window.location, "pathname", { value: "/2026-01-15" })
    expect(getDateFromUrl()).toBe("2026-01-15")
  })

  it("returns null for root path", () => {
    Object.defineProperty(window.location, "pathname", { value: "/" })
    expect(getDateFromUrl()).toBeNull()
  })

  it("returns null for invalid date path", () => {
    Object.defineProperty(window.location, "pathname", { value: "/not-a-date" })
    expect(getDateFromUrl()).toBeNull()
  })

  it("returns null for impossible date", () => {
    Object.defineProperty(window.location, "pathname", { value: "/2026-02-30" })
    expect(getDateFromUrl()).toBeNull()
  })
})

describe("getTodayDate", () => {
  it("returns today in YYYY-MM-DD format", () => {
    const result = getTodayDate()
    expect(isValidDateFormat(result)).toBe(true)
    const now = new Date()
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-")
    expect(result).toBe(expected)
  })
})

describe("updateUrl", () => {
  let pushStateSpy: ReturnType<typeof vi.spyOn>
  let replaceStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    pushStateSpy = vi.spyOn(window.history, "pushState").mockImplementation(() => {})
    replaceStateSpy = vi.spyOn(window.history, "replaceState").mockImplementation(() => {})
  })

  afterEach(() => {
    pushStateSpy.mockRestore()
    replaceStateSpy.mockRestore()
  })

  it("uses pushState by default", () => {
    updateUrl("2026-01-15")
    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "/2026-01-15")
    expect(replaceStateSpy).not.toHaveBeenCalled()
  })

  it("uses replaceState when replace is true", () => {
    updateUrl("2026-01-15", true)
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/2026-01-15")
    expect(pushStateSpy).not.toHaveBeenCalled()
  })

  it("uses pushState when replace is false", () => {
    updateUrl("2026-01-15", false)
    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "/2026-01-15")
    expect(replaceStateSpy).not.toHaveBeenCalled()
  })
})
