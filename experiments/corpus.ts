/*
Loads the NYT crossword clue corpus (data/nytcrosswords.csv, 1993-2021) and filters it to
clue/answer pairs that could plausibly appear in a Spelling Bee context: real dictionary words
that meet Bee eligibility rules, with clues that make sense outside a crossword grid.
*/

import { readFileSync } from "fs"
import { join } from "path"

/** Load the corpus, filtered to Spelling-Bee-plausible clue/answer pairs, memoized. */
export function loadEligibleClues(): CorpusClue[] {
  cachedClues ??= loadAllClues().filter(isEligible)
  return cachedClues
}

/** Get all human-written clues for one answer word. */
export function referenceClues(word: string): string[] {
  return loadEligibleClues()
    .filter(clue => clue.word === word.toUpperCase())
    .map(clue => clue.clue)
}

/** Load and parse the corpus CSV into deduplicated clue records. */
function loadAllClues(): CorpusClue[] {
  // The Kaggle CSV is latin-1, not UTF-8
  const text = readFileSync(DATA_FILE, "latin1")
  const rows = parseCsv(text)

  const seen = new Set<string>()
  const clues: CorpusClue[] = []
  for (const [date, word, clue] of rows) {
    const key = `${word}\t${clue}`
    if (seen.has(key)) continue
    seen.add(key)
    const parsed = parseDate(date)
    if (!parsed) continue
    clues.push({ date: parsed.iso, weekday: parsed.weekday, word: word.toUpperCase(), clue })
  }
  return clues
}

/** Decide whether a clue/answer pair works as a Spelling Bee hint example. */
function isEligible({ word, clue }: CorpusClue): boolean {
  // Answer must be a Spelling-Bee-eligible word: 4+ letters, at most 7 distinct letters, no S
  // (NYT Spelling Bee never includes S), and a real lowercase dictionary word (this drops
  // proper nouns, abbreviations, multi-word phrases run together, and most crosswordese)
  if (!/^[A-Z]{4,}$/.test(word)) return false
  if (new Set(word).size > 7) return false
  if (word.includes("S")) return false
  if (!dictionary().has(word.toLowerCase())) return false

  // Clue must make sense outside a crossword grid
  if (/\d+-(Across|Down)/i.test(clue)) return false // cross-references
  if (/(^|\s)(starred|circled|shaded|asterisked)\b/i.test(clue)) return false // theme mechanics
  if (/\[.*\]|\.\.\.$|^\.\.\./.test(clue)) return false // theme fragments and continuations
  if (/\babbr\b|\babbreviation\b|(^|\s)briefly\b|\bfor short\b/i.test(clue)) return false
  if (/this puzzle/i.test(clue)) return false // self-referential
  if (clue.toUpperCase().includes(word)) return false // clue reveals the answer

  // Skip clues treating the answer as a proper noun (the Spelling Bee has no proper nouns)
  if (
    /\b(actor|actress|singer|rapper|director|novelist|author|composer|golfer|playwright|poet|painter|pitcher|quarterback)\b/i.test(
      clue,
    )
  )
    return false
  if (/^[A-Z][a-z]+ of "/.test(clue)) return false // e.g. `Ustinov of "Topkapi"`

  return true
}

/** Parse a M/D/YYYY date into ISO format plus weekday name. */
function parseDate(date: string): { iso: string; weekday: string } | null {
  const match = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const [, month, day, year] = match.map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return {
    iso: d.toISOString().slice(0, 10),
    weekday: WEEKDAYS[d.getUTCDay()],
  }
}

/** Parse a simple CSV with quoted fields into [date, word, clue] rows. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split("\n")
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    if (!line) continue
    const fields: string[] = []
    let field = ""
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (inQuotes) {
        if (char === '"' && line[j + 1] === '"') ((field += '"'), j++)
        else if (char === '"') inQuotes = false
        else field += char
      } else {
        if (char === '"') inQuotes = true
        else if (char === ",") (fields.push(field), (field = ""))
        else field += char
      }
    }
    fields.push(field)
    if (fields.length === 3) rows.push(fields)
  }
  return rows
}

/** Load the system dictionary as a lowercase word set, memoized. */
function dictionary(): Set<string> {
  cachedDictionary ??= new Set(
    readFileSync(DICT_FILE, "utf-8")
      .split("\n")
      .filter(word => /^[a-z]+$/.test(word)),
  )
  return cachedDictionary
}

// STATE

let cachedClues: CorpusClue[] | null = null
let cachedDictionary: Set<string> | null = null

// CONSTANTS

const DATA_FILE = join(import.meta.dirname, "../data/nytcrosswords.csv")
const DICT_FILE = "/usr/share/dict/words"

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

// TYPES

/** A single human-written NYT clue for an answer word. */
export type CorpusClue = {
  date: string
  weekday: string
  word: string
  clue: string
}
