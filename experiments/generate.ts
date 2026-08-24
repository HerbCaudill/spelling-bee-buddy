/*
Generates a batch of Spelling Bee hints using a numbered prompt and a codex model for direct
review. Samples words from the crossword corpus, fills the prompt template, runs it through
`codex exec`, and saves a numbered run file to experiments/runs/.

Usage:
  node experiments/generate.ts --prompt 003 [options]

Options:
  --prompt 001         Prompt number (file in experiments/prompts/)
  --model luna|terra|sol   Codex model tier (default: sol)
  --n 20               Number of words (default: 20)
  --seed abc           Word-sampling seed (default: the run id, so each run gets fresh words)
  --words VENOM,GIZMO  Use these words instead of sampling
*/

import { execFileSync } from "child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { loadEligibleClues } from "./corpus.ts"
import { sampleWithoutReplacement } from "./random.ts"

/** Generate one run: sample words, build the prompt, call codex, save the run file. */
function main() {
  const args = parseArgs(process.argv.slice(2))
  const runId = nextRunId()
  const template = readFileSync(join(PROMPTS_DIR, `${args.prompt}.txt`), "utf-8")

  const words = args.words ?? sampleWords(args.n, args.seed ?? runId)
  const prompt = template.replace("{{words}}", words.join("\n"))

  console.error(`Run ${runId}: prompt ${args.prompt}, ${args.model}, ${words.length} words`)
  console.error(words.join(" "))

  const hints = generateHints(prompt, args.model)

  const run: Run = {
    id: runId,
    prompt: args.prompt,
    model: args.model,
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
  const args: Args = { prompt: "001", model: MODELS.sol, n: 20, seed: null, words: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--prompt") args.prompt = argv[++i].padStart(3, "0")
    else if (arg === "--model") args.model = MODELS[argv[++i]] ?? argv[i]
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

/** Run the prompt through codex and parse the returned hints. */
function generateHints(prompt: string, model: string): Record<string, string> {
  const outputFile = join(tmpdir(), `hints-${process.pid}.json`)
  execFileSync(
    codexBin(),
    [
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "-s",
      "read-only",
      "-m",
      model,
      "-o",
      outputFile,
      "--color",
      "never",
      "-",
    ],
    { input: prompt, encoding: "utf-8", stdio: ["pipe", "ignore", "ignore"] },
  )
  const output = readFileSync(outputFile, "utf-8")
  rmSync(outputFile)

  // Tolerate markdown fences or chatter around the JSON object
  const start = output.indexOf("{")
  const end = output.lastIndexOf("}")
  if (start === -1 || end === -1) throw new Error(`No JSON in codex output:\n${output}`)
  const parsed = JSON.parse(output.slice(start, end + 1)) as { hints: Record<string, string> }
  return Object.fromEntries(
    Object.entries(parsed.hints).map(([word, hint]) => [word.toUpperCase(), hint]),
  )
}

/** Locate a working codex binary (the proto shim on PATH is broken; prefer pnpm's). */
function codexBin(): string {
  const pnpmCodex = join(process.env.HOME ?? "", "Library/pnpm/bin/codex")
  return existsSync(pnpmCodex) ? pnpmCodex : "codex"
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

/** Short names for the codex model tiers. */
const MODELS: Record<string, string> = {
  luna: "gpt-5.6-luna",
  terra: "gpt-5.6-terra",
  sol: "gpt-5.6-sol",
}

// TYPES

type Args = {
  prompt: string
  model: string
  n: number
  seed: string | null
  words: string[] | null
}

/** One generated batch of hints. */
export type Run = {
  id: string
  prompt: string
  model: string
  createdAt: string
  items: RunItem[]
}

/** One word/hint pair. */
export type RunItem = {
  word: string
  hint: string
}

main()
