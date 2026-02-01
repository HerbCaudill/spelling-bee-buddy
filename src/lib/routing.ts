/** Regex for YYYY-MM-DD date format */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Check if a string is a valid YYYY-MM-DD date format.
 * Validates both format and that the date actually exists (e.g. rejects 2026-02-30).
 */
export function isValidDateFormat(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const date = new Date(value + "T12:00:00")
  if (isNaN(date.getTime())) return false
  // Verify the parsed date matches the input (catches invalid dates like Feb 30)
  const [year, month, day] = value.split("-").map(Number)
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
}

/**
 * Extract a date string from the current URL pathname.
 * Returns the date if the path is `/YYYY-MM-DD`, otherwise null.
 */
export function getDateFromUrl(): string | null {
  const path = window.location.pathname.replace(/^\//, "")
  return isValidDateFormat(path) ? path : null
}

/**
 * Get today's date in YYYY-MM-DD format.
 */
export function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Update the URL to reflect the given date.
 * Uses replaceState by default (no history entry), or pushState if replace is false.
 */
export function updateUrl(
  /** Date in YYYY-MM-DD format */
  date: string,
  /** If true, replaces the current history entry instead of pushing a new one */
  replace = false,
) {
  const url = `/${date}`
  if (replace) {
    window.history.replaceState(null, "", url)
  } else {
    window.history.pushState(null, "", url)
  }
}
