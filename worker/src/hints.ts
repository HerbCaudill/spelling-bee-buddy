/**
 * Hint generation using Anthropic API
 */

import type { GameData, CachedHints } from "./types"

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

/**
 * Cache key version - increment when hint format changes to invalidate old cached hints.
 * v2: Added `word` property to hints for accurate filtering by found words.
 * v3: Switched to the refined crossword-style prompt and Claude Sonnet 5.
 */
const CACHE_VERSION = "v3"

/**
 * Build the KV cache key for a puzzle date
 */
export function buildCacheKey(printDate: string): string {
  return `hints:${CACHE_VERSION}:${printDate}`
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
      model: "claude-sonnet-5",
      max_tokens: 4096,
      output_config: { effort: "low" },
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
  const textContent = result.content.find(content => content.type === "text" && content.text)
  const hintsText = textContent?.text ?? ""
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

  return `Write hints for an NYT Spelling Bee companion in the style of polished Friday or Saturday American crossword clues. Do not write cryptic clues. Keep each clue concise, natural, accurate, and fair, but make the solver take one mental step.

Treat every entry as one standalone lowercase dictionary word exactly as spelled. Never split it into a phrase, reinterpret it as initials, or use a proper-name reading. If its spelling resembles a more familiar phrase or name, ignore that resemblance and clue the standalone word. For example, \`DOIT\` means an old Dutch coin; it is not “do it.” An optional “(pangram)” label is only metadata.

Match the answer's grammar exactly. The answer must be able to substitute for the clue without changing part of speech, number, tense, or degree. For example, \`TANKED\` could be clued as "Drunk" (an adjective), but not “Got drunk” (a verb phrase). Or, using another sense of the word, \`TANKED\` could also be clued as "Went downhill" (a verb phrase) but not "Downhill" (an adjective).

Clue familiar words obliquely; do not give a dictionary definition or close synonym. Use an exact but indirect route such as a familiar situation, characteristic example, secondary sense, idiom, or light wordplay. Use misdirection only when it remains natural and defensible. Clue an obscure or technical word more directly so it stays solvable.

Do not use the answer or a form of it in the clue. Avoid strained metaphors, vague associations, approximate facts, and wordplay that depends on splitting the answer into multiple words. Silently check the standalone word sense, grammatical substitution, accuracy, phrasing, difficulty, and fairness of every clue before responding.

Words to generate clues for:
${wordsList}

Respond with ONLY a JSON object in this exact format, with no markdown or extra text:
\`\`\`json
{
  "hints": {
    "WORD": "clue text here"
  }
}
\`\`\`

Include every listed word exactly once as a key in the hints object.`
}

/**
 * Parse Claude's response and organize hints by two-letter prefix
 *
 * Throws if the response isn't valid JSON — we must not cache placeholder
 * hints, since cached entries live for 7 days.
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
    console.error("Failed to parse hints response:", responseText.slice(0, 200))
    throw new Error("Received an unparseable response from the hint generator. Please try again.")
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
