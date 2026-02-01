#!/usr/bin/env node

import { spawn } from "child_process"

const WORKER_URL = "http://localhost:8787"
const POLL_INTERVAL = 500
const MAX_WAIT = 30000

async function isWorkerReady() {
  try {
    const response = await fetch(WORKER_URL)
    return response.ok || response.status === 404 // Any response means it's running
  } catch {
    return false
  }
}

async function waitForWorker() {
  const start = Date.now()
  console.log("⏳ Waiting for worker to be ready...")

  while (Date.now() - start < MAX_WAIT) {
    if (await isWorkerReady()) {
      console.log("✅ Worker is ready!")
      return true
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
  }

  console.error("❌ Worker failed to start within timeout")
  return false
}

async function main() {
  // Start worker in background
  console.log("🚀 Starting worker...")
  const worker = spawn("pnpm", ["dev:worker"], {
    stdio: "inherit",
  })

  worker.on("error", err => {
    console.error("Failed to start worker:", err)
    process.exit(1)
  })

  // Wait for worker to be ready
  const ready = await waitForWorker()
  if (!ready) {
    worker.kill()
    process.exit(1)
  }

  // Start the app
  console.log("🚀 Starting app...")
  const app = spawn("pnpm", ["dev:app", "--host"], {
    stdio: "inherit",
  })

  app.on("error", err => {
    console.error("Failed to start app:", err)
    worker.kill()
    process.exit(1)
  })

  // Handle cleanup
  const cleanup = () => {
    console.log("\n🛑 Shutting down...")
    app.kill()
    worker.kill()
    process.exit(0)
  }

  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
}

main()
