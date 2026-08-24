import { execFileSync } from "child_process"
import { existsSync, readFileSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

/** Resolve a model alias to a provider, model id, and pinned effort level. */
export function resolveModel(name: string): ModelSpec {
  const id = MODEL_ALIASES[name] ?? name
  return {
    provider: id.startsWith("claude-") ? "claude" : "codex",
    id,
    effort: "high",
  }
}

/** Generate and parse hints with the selected model provider. */
export function generateHints(prompt: string, model: ModelSpec): Record<string, string> {
  const output =
    model.provider === "claude" ?
      generateWithClaude(prompt, model)
    : generateWithCodex(prompt, model)
  return parseHints(output)
}

/** Run a prompt through Codex. */
function generateWithCodex(prompt: string, model: ModelSpec): string {
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
      model.id,
      "-c",
      `model_reasoning_effort="${model.effort}"`,
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
  return output
}

/** Run a prompt through Claude Code without project customizations or tools. */
function generateWithClaude(prompt: string, model: ModelSpec): string {
  const output = execFileSync(
    "claude",
    [
      "-p",
      "--safe-mode",
      "--model",
      model.id,
      "--effort",
      model.effort,
      "--tools",
      "",
      "--no-session-persistence",
      "--output-format",
      "json",
      prompt,
    ],
    { encoding: "utf-8" },
  )
  const result = JSON.parse(output) as ClaudeResult
  if (result.is_error) throw new Error(result.result)
  return result.result
}

/** Parse a model's JSON hints, tolerating fences or surrounding text. */
function parseHints(output: string): Record<string, string> {
  const start = output.indexOf("{")
  const end = output.lastIndexOf("}")
  if (start === -1 || end === -1) throw new Error(`No JSON in model output:\n${output}`)
  const parsed = JSON.parse(output.slice(start, end + 1)) as { hints: Record<string, string> }
  return Object.fromEntries(
    Object.entries(parsed.hints).map(([word, hint]) => [word.toUpperCase(), hint]),
  )
}

/** Locate a working Codex binary. */
function codexBin(): string {
  const pnpmCodex = join(process.env.HOME ?? "", "Library/pnpm/bin/codex")
  return existsSync(pnpmCodex) ? pnpmCodex : "codex"
}

// CONSTANTS

const MODEL_ALIASES: Record<string, string> = {
  luna: "gpt-5.6-luna",
  terra: "gpt-5.6-terra",
  sol: "gpt-5.6-sol",
  fable: "claude-fable-5",
  opus: "claude-opus-5",
}

// TYPES

export type ModelSpec = {
  provider: "codex" | "claude"
  id: string
  effort: "high"
}

type ClaudeResult = {
  is_error: boolean
  result: string
}
