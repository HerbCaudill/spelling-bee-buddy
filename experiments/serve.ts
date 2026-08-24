/*
Serves the hint-judging UI at http://localhost:8123 and persists ratings back into the run
files in experiments/runs/.

Usage:
  node experiments/serve.ts
*/

import { createServer, type IncomingMessage, type ServerResponse } from "http"
import { readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import type { Run } from "./generate.ts"

const PORT = 8123
const RUNS_DIR = join(import.meta.dirname, "runs")

createServer(handle).listen(PORT, () => {
  console.log(`Judge UI at http://localhost:${PORT}`)
})

/** Route a request. */
async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)
  const rateMatch = url.pathname.match(/^\/api\/runs\/(\d+)\/rate$/)
  const runMatch = url.pathname.match(/^\/api\/runs\/(\d+)$/)

  try {
    if (url.pathname === "/") return sendHtml(res)
    if (url.pathname === "/api/runs") return sendJson(res, listRuns())
    if (runMatch) return sendJson(res, loadRun(runMatch[1]))
    if (rateMatch && req.method === "POST") return sendJson(res, await rate(rateMatch[1], req))
    res.writeHead(404).end("Not found")
  } catch (error) {
    res.writeHead(500).end(String(error))
  }
}

/** Save a rating into a run file. */
async function rate(runId: string, req: IncomingMessage): Promise<Run> {
  const { index, rating, notes } = JSON.parse(await readBody(req)) as {
    index: number
    rating: number
    notes: string
  }
  const run = loadRun(runId)
  run.items[index].rating = rating
  run.items[index].notes = notes
  writeFileSync(join(RUNS_DIR, `${runId}.json`), JSON.stringify(run, null, 2) + "\n")
  return run
}

/** List runs, newest first, with rating progress. */
function listRuns() {
  return readdirSync(RUNS_DIR)
    .filter(name => /^\d+\.json$/.test(name))
    .sort()
    .reverse()
    .map(name => {
      const run = loadRun(name.replace(".json", ""))
      return {
        id: run.id,
        prompt: run.prompt,
        model: run.model,
        createdAt: run.createdAt,
        rated: run.items.filter(item => item.rating !== null).length,
        total: run.items.length,
      }
    })
}

/** Load one run file. */
function loadRun(runId: string): Run {
  return JSON.parse(readFileSync(join(RUNS_DIR, `${runId}.json`), "utf-8"))
}

/** Read a request body as a string. */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let body = ""
    req.on("data", chunk => (body += chunk))
    req.on("end", () => resolve(body))
  })
}

/** Serve the UI page. */
function sendHtml(res: ServerResponse) {
  res.writeHead(200, { "Content-Type": "text/html" })
  res.end(readFileSync(join(import.meta.dirname, "judge.html")))
}

/** Serve a JSON response. */
function sendJson(res: ServerResponse, data: unknown) {
  res.writeHead(200, { "Content-Type": "application/json" })
  res.end(JSON.stringify(data))
}
