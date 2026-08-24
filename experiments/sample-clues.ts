/*
Prints a sample of real NYT crossword clues from the corpus, for browsing or for pasting
few-shot examples into a prompt.

Usage:
  node experiments/sample-clues.ts [options]

Options:
  --days Mon,Tue,...   Only include clues from these weekdays (default: all)
  --n 50               Sample size (default: 50)
  --seed abc           Seed for reproducible sampling (default: "seed")
  --word WORD          Show all clues for one answer word instead of sampling
  --tsv                Output tab-separated (date, weekday, word, clue) instead of aligned text
*/

import { loadEligibleClues, WEEKDAYS, type CorpusClue } from "./corpus.ts"
import { sampleWithoutReplacement } from "./random.ts"

main()

/** Parse arguments, filter the corpus, and print the requested sample. */
function main() {
  const args = parseArgs(process.argv.slice(2))
  const clues = loadEligibleClues().filter(clue => !args.days || args.days.includes(clue.weekday))

  if (args.word) {
    const word = args.word.toUpperCase()
    const matches = clues.filter(clue => clue.word === word)
    print(matches, args.tsv)
    console.error(`${matches.length} clues for ${word}`)
    return
  }

  const sample = sampleWithoutReplacement(clues, args.n, args.seed)
  print(sample, args.tsv)
  console.error(`${sample.length} of ${clues.length} eligible clues`)
}

/** Parse the command line into typed options. */
function parseArgs(argv: string[]): Args {
  const args: Args = { days: null, n: 50, seed: "seed", word: null, tsv: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--days") args.days = argv[++i].split(",").map(normalizeDay)
    else if (arg === "--n") args.n = Number(argv[++i])
    else if (arg === "--seed") args.seed = argv[++i]
    else if (arg === "--word") args.word = argv[++i]
    else if (arg === "--tsv") args.tsv = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

/** Print clues as aligned text or TSV. */
function print(clues: CorpusClue[], tsv: boolean) {
  for (const { date, weekday, word, clue } of clues) {
    if (tsv) console.log([date, weekday, word, clue].join("\t"))
    else console.log(`${date} ${weekday.padEnd(9)} ${word.padEnd(15)} ${clue}`)
  }
}

/** Expand day abbreviations like "Mon" or "sat" to full weekday names. */
function normalizeDay(day: string): string {
  const match = WEEKDAYS.find(w => w.toLowerCase().startsWith(day.toLowerCase().slice(0, 3)))
  if (!match) throw new Error(`Unknown weekday: ${day}`)
  return match
}

// TYPES

type Args = {
  days: string[] | null
  n: number
  seed: string
  word: string | null
  tsv: boolean
}
