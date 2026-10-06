import { spawn, execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { get } from "node:https"
import { homedir } from "node:os"
import { join } from "node:path"
import { setTimeout as delay } from "node:timers/promises"

/** Public worker origin for this checkout; direct development stays available for tests. */
const workerUrl =
  process.env.PORTLESS_URL ?
    execFileSync("localhost-dev", ["url", "--service", "api"], { encoding: "utf8" }).trim()
  : "http://127.0.0.1:8787"
/** Processes started by this launcher, each with its own signal group. */
const children = []
let stopping = false

/** Check the worker's health through its exact routed hostname with TLS verification. */
async function ready() {
  if (!process.env.PORTLESS_URL) {
    try {
      return (await fetch(`${workerUrl}/health`)).ok
    } catch {
      return false
    }
  }
  const url = new URL(workerUrl)
  return new Promise(resolve => {
    const request = get(
      {
        hostname: "127.0.0.1",
        port: 443,
        servername: url.hostname,
        path: "/health",
        headers: { host: url.host },
        ca: readFileSync(join(homedir(), ".portless", "ca.pem")),
        timeout: 1000,
      },
      response => {
        response.resume()
        resolve(response.statusCode === 200)
      },
    )
    request.on("error", () => resolve(false))
    request.on("timeout", () => request.destroy())
  })
}

/** Stop only the process groups this launcher started and let their route owners exit. */
function stop(code = 0) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) {
    if (child.exitCode !== null || child.signalCode !== null) continue
    try {
      process.kill(-child.pid, "SIGTERM")
    } catch {}
  }
}

/** Start one package script and stop the other service if it exits. */
function start(script, env = process.env) {
  const child = spawn("pnpm", [script], { env, stdio: "inherit", detached: true })
  children.push(child)
  child.on("error", () => stop(1))
  child.on("exit", code => stop(code ?? 1))
  return child
}

process.on("SIGINT", () => stop())
process.on("SIGTERM", () => stop())
start(process.env.PORTLESS_URL ? "dev:worker" : "dev:worker:app")
const deadline = Date.now() + 30000
while (!stopping && !(await ready())) {
  if (Date.now() >= deadline) {
    console.error("Worker did not become ready within 30 seconds.")
    stop(1)
    break
  }
  await delay(250)
}
if (!stopping) start("dev:app", { ...process.env, VITE_WORKER_URL: workerUrl })
