/*
Generates a batch of Spelling Bee hints using a numbered prompt and a codex model for direct
review. Samples words from the crossword corpus, fills the prompt template, runs it through
`codex exec`, and saves a numbered run file to experiments/runs/.

Usage:
  node experiments/generate.ts --prompt 003 [options]

Options:
  --prompt 001         Prompt number (file in experiments/prompts/)
  --model luna|terra|sol|fable|opus   Model alias (default: sol)
  --effort low|medium|high|xhigh      Reasoning effort (default: high)
  --n 20               Number of words (default: 20)
  --seed abc           Word-sampling seed (default: the run id, so each run gets fresh words)
  --words VENOM,GIZMO  Use these words instead of sampling
*/

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { loadEligibleClues } from "./corpus.ts"
import { generateHints, resolveModel, type Effort } from "./models.ts"
import { sampleWithoutReplacement } from "./random.ts"

/** Generate one run: sample words, build the prompt, call codex, save the run file. */
function main() {
  const args = parseArgs(process.argv.slice(2))
  const runId = nextRunId()
  const template = readFileSync(join(PROMPTS_DIR, `${args.prompt}.txt`), "utf-8")
  const model = resolveModel(args.model, args.effort)

  const words = args.words ?? sampleWords(args.n, args.seed ?? runId)
  const prompt = template.replace("{{words}}", words.join("\n"))

  console.error(`Run ${runId}: prompt ${args.prompt}, ${model.id}, ${words.length} words`)
  console.error(words.join(" "))

  const hints = generateHints(prompt, model)

  const run: Run = {
    id: runId,
    prompt: args.prompt,
    model: model.id,
    provider: model.provider,
    effort: model.effort,
    createdAt: new Date().toISOString(),
    items: words.map(word => ({
      word,
      hint: hints[word] ?? "(no hint returned)",
    })),
  }

  mkdirSync(RUNS_DIR, { recursive: true })
  writeFileSync(join(RUNS_DIR, `${runId}.json`), JSON.stringify(run, null, 2) + "\n")

  for (const item of run.items) console.log(`${item.word.padEnd(12)} ${item.hint}`)
  console.error(`\nSaved runs/${runId}.json`)
}

/** Parse the command line into typed options. */
function parseArgs(argv: string[]): Args {
  const args: Args = {
    prompt: "001",
    model: "sol",
    effort: "high",
    n: 20,
    seed: null,
    words: null,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--prompt") args.prompt = argv[++i].padStart(3, "0")
    else if (arg === "--model") args.model = argv[++i]
    else if (arg === "--effort") args.effort = argv[++i] as Effort
    else if (arg === "--n") args.n = Number(argv[++i])
    else if (arg === "--seed") args.seed = argv[++i]
    else if (arg === "--words") args.words = argv[++i].toUpperCase().split(",")
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

/** Sample distinct corpus words, weighted naturally by clue frequency. */
function sampleWords(n: number, seed: string): string[] {
  const words = [...new Set(loadEligibleClues().map(clue => clue.word))]
  return sampleWithoutReplacement(words, n, seed)
}

/** Find the next sequential run id by scanning the runs directory. */
function nextRunId(): string {
  mkdirSync(RUNS_DIR, { recursive: true })
  const existing = readdirSync(RUNS_DIR)
    .map(name => name.match(/^(\d+)\.json$/)?.[1])
    .filter(Boolean)
    .map(Number)
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
  return String(next).padStart(3, "0")
}

// CONSTANTS

const PROMPTS_DIR = join(import.meta.dirname, "prompts")
const RUNS_DIR = join(import.meta.dirname, "runs")

// TYPES

type Args = {
  prompt: string
  model: string
  effort: Effort
  n: number
  seed: string | null
  words: string[] | null
}

/** One generated batch of hints. */
export type Run = {
  id: string
  prompt: string
  model: string
  provider: "codex" | "claude"
  effort: string
  createdAt: string
  items: RunItem[]
}

/** One word/hint pair. */
export type RunItem = {
  word: string
  hint: string
}

main()
