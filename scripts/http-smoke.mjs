import { execFileSync, spawn } from "node:child_process"
import assert from "node:assert/strict"

const origin = "http://127.0.0.1:3101"
// Dev mode compiles with explicit blank public env values, so this smoke test cannot
// inherit a previously built client bundle's Supabase URL or contact a configured project.
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3101"], {
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"],
})
let output = ""
server.stdout.on("data", (chunk) => { output += chunk.toString() })
server.stderr.on("data", (chunk) => { output += chunk.toString() })
server.on("error", (error) => { output += error.message })
try {
  const started = Date.now()
  const deadline = started + 120_000
  while (!output.includes("Ready in")) {
    if (server.exitCode !== null || server.signalCode !== null || Date.now() > deadline) throw new Error(`Isolated Next server did not start on port 3101 after ${Date.now() - started}ms (exit=${server.exitCode}, signal=${server.signalCode}).\n${output}`)
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  for (const path of ["/dashboard", "/dashboard/syllabus", "/dashboard/plan"]) {
    const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(60_000) })
    assert.equal(response.status, 200)
    assert.match(await response.text(), /Connect your saved workspace/)
    assert.match(response.headers.get("cache-control") ?? "", /private|no-store/)
  }
  const expired = await fetch(`${origin}/auth/callback?next=https://example.com`, { redirect: "manual" })
  assert.equal(expired.status, 303)
  assert.equal(expired.headers.get("location"), "/auth?link=expired")
  const auth = await fetch(`${origin}/auth?link=expired`)
  assert.match(await auth.text(), /This link could not be verified/)
  const landing = await fetch(origin)
  assert.match(await landing.text(), /42 curated topics/)
  console.log("HTTP smoke passed: 3 private setup routes, fixed callback redirect, auth recovery, and landing page.")
} finally {
  if (server.pid && server.exitCode === null) {
    // Only terminate this test's child tree; Next dev forks its own server on Windows.
    if (process.platform === "win32") {
      try { execFileSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" }) }
      catch { server.kill() }
    } else server.kill()
  }
}
