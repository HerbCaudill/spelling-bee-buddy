import { describe, expect, test } from "vitest"
import { resolveModel } from "../models.ts"

describe("resolveModel", () => {
  test.each([
    ["sol", "codex", "gpt-5.6-sol"],
    ["fable", "claude", "claude-fable-5"],
    ["opus", "claude", "claude-opus-5"],
  ] as const)("resolves %s to its current model", (alias, provider, id) => {
    expect(resolveModel(alias)).toEqual({ provider, id, effort: "high" })
  })
})
