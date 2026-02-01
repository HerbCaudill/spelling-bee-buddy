/**
 * Hint generation using Anthropic API
 */

import type { GameData, CachedHints } from "./types"

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

/**
 * Build the KV cache key for a puzzle date
 */
export function buildCacheKey(printDate: string): string {
  return `hints:${printDate}`
}

/**
 * Generate hints for all words in the puzzle using Claude
 */
export async function generateHints(
  gameData: GameData,
  anthropicKey: string,
): Promise<CachedHints> {
  const words = gameData.today.answers
  const pangrams = new Set(gameData.today.pangrams)

  // Build the prompt for Claude
  const prompt = buildHintPrompt(words, pangrams)

  // Call Anthropic API
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`)
  }

  const result = (await response.json()) as AnthropicResponse

  // Parse the response to extract hints
  const firstContent = result.content[0]
  const hintsText = firstContent?.type === "text" && firstContent.text ? firstContent.text : ""
  const hints = parseHintsResponse(hintsText, words)

  return {
    generatedAt: new Date().toISOString(),
    hints,
  }
}

/**
 * Anthropic API response type (simplified)
 */
interface AnthropicResponse {
  content: Array<{
    type: string
    text?: string
  }>
}

/**
 * Build the prompt for generating hints
 */
function buildHintPrompt(words: string[], pangrams: Set<string>): string {
  const wordsList = words.map(w => `${w}${pangrams.has(w) ? " (pangram)" : ""}`).join("\n")

  return `You are a helpful assistant for the NYT Spelling Bee puzzle. Generate a short, clever hint for each word that helps the solver guess it without giving away the answer directly.

Guidelines for hints:
- Each hint should be 3-10 words
- Use definitions, synonyms, or clever wordplay
- Don't include any letters from the word itself
- For pangrams, make the hint slightly more elaborate
- Be creative but clear

Words to generate hints for:
${wordsList}

Respond with ONLY a JSON object in this exact format (no markdown, no extra text):
{
  "hints": {
    "WORD": "hint text here"
  }
}

Include every word from the list above as a key in the hints object.`
}

/**
 * Parse Claude's response and organize hints by two-letter prefix
 */
function parseHintsResponse(responseText: string, words: string[]): CachedHints["hints"] {
  // Try to parse the JSON response
  let parsedHints: Record<string, string> = {}

  try {
    // Handle potential markdown code blocks
    let jsonText = responseText.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "")
    }
    const parsed = JSON.parse(jsonText) as { hints: Record<string, string> }
    parsedHints = parsed.hints || {}
  } catch {
    // If parsing fails, create fallback hints
    console.error("Failed to parse hints response:", responseText.slice(0, 200))
    for (const word of words) {
      parsedHints[word] = `${word.length}-letter word`
    }
  }

  // Organize hints by two-letter prefix
  const hintsByPrefix: CachedHints["hints"] = {}

  for (const word of words) {
    const prefix = word.slice(0, 2).toUpperCase()
    const hint =
      parsedHints[word] ||
      parsedHints[word.toUpperCase()] ||
      parsedHints[word.toLowerCase()] ||
      `${word.length}-letter word`

    if (!hintsByPrefix[prefix]) {
      hintsByPrefix[prefix] = []
    }

    hintsByPrefix[prefix].push({
      word: word.toUpperCase(),
      hint,
      length: word.length,
    })
  }

  // Sort hints within each prefix by length
  for (const prefix of Object.keys(hintsByPrefix)) {
    hintsByPrefix[prefix].sort((a, b) => a.length - b.length)
  }

  return hintsByPrefix
}
