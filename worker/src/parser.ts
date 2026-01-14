/**
 * Parser utilities for extracting puzzle data from NYT Spelling Bee page
 */

import type { GameData } from "./types"

/**
 * Extract a JSON object from a string starting at position start.
 * Counts braces to find the complete object.
 */
function extractJsonObject(str: string, start: number): string | null {
  if (str[start] !== "{") return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < str.length; i++) {
    const char = str[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === "\\") {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === "{") depth++
    if (char === "}") {
      depth--
      if (depth === 0) {
        return str.slice(start, i + 1)
      }
    }
  }

  return null
}

/**
 * Parse window.gameData from the NYT Spelling Bee page HTML
 */
export function parseGameData(html: string): GameData | null {
  // Find the start of window.gameData assignment
  const marker = "window.gameData"
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) return null

  // Find the opening brace of the JSON object
  const jsonStart = html.indexOf("{", markerIndex)
  if (jsonStart === -1) return null

  // Extract the complete JSON object by counting braces
  const jsonString = extractJsonObject(html, jsonStart)
  if (!jsonString) return null

  try {
    const rawData = JSON.parse(jsonString)

    // Validate that we have the expected structure
    if (!rawData.today) {
      return null
    }

    const today = rawData.today
    const gameData: GameData = {
      today: {
        displayWeekday: today.displayWeekday,
        displayDate: today.displayDate,
        printDate: today.printDate,
        centerLetter: today.centerLetter,
        outerLetters: today.outerLetters,
        validLetters: today.validLetters,
        pangrams: today.pangrams,
        answers: today.answers,
        id: today.id,
      },
    }

    return gameData
  } catch {
    return null
  }
}
