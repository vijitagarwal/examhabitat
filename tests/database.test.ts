// @vitest-environment node
import { PGlite } from "@electric-sql/pglite"
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { workspaceSchema } from "@/lib/workspace"
import { catTopics } from "@/lib/cat-syllabus"

const userA = "00000000-0000-4000-8000-000000000001"
const userB = "00000000-0000-4000-8000-000000000002"
let db: PGlite
const preferences = { dailyMinutes: 60, maxTasks: 3, timezone: "Asia/Kolkata", targetDate: null }
const progress = { topicId: catTopics[0].id, status: "learning", confidence: 2, priority: 4, minutesStudied: 25 }

async function asUser(id: string) {
  await db.exec("reset role; set role authenticated;")
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id])
}
async function snapshot() {
  const { rows } = await db.query<{ data: unknown }>("select public.read_cat_workspace() data")
  return workspaceSchema.parse(rows[0].data)
}
async function mutate(operation: string, payload: unknown, revision: number, requestId = randomUUID()) {
  const { rows } = await db.query<{ data: unknown }>("select public.mutate_cat_workspace($1, $2, $3, $4::jsonb) data", [requestId, revision, operation, JSON.stringify(payload)])
  return workspaceSchema.parse(rows[0].data)
}
async function planPayload() {
  return { preferences, planDate: (await snapshot()).today, algorithmVersion: "cat-planner-v1", tasks: [
    { topicId: catTopics[0].id, position: 1, plannedMinutes: 35, reason: "A focused foundation for today's work." },
    { topicId: catTopics[5].id, position: 2, plannedMinutes: 25, reason: "A focused foundation for today's work." },
  ] }
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;`)
  for (const name of ["0001_foundation.sql", "0002_cat_syllabus_progress_plans.sql", "0003_atomic_cat_workspace.sql"]) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"))
  }
  await db.query("insert into auth.users(id) values ($1), ($2)", [userA, userB])
}, 60000)
beforeEach(async () => { await db.exec("begin"); await asUser(userA) })
afterEach(async () => { await db.exec("rollback; reset role") })
afterAll(async () => { await db?.close() })

describe("PostgreSQL migration, RLS and atomic writes (local PGlite)", () => {
  it("seeds the catalog and reads a real empty-account snapshot", async () => {
    const data = await snapshot()
    expect(data.catalog.topics.map((t) => t.id).sort()).toEqual(catTopics.map((t) => t.id).sort())
    for (const topic of data.catalog.topics) {
      const expected = catTopics.find((t) => t.id === topic.id)!
      expect(topic).toMatchObject({ catalogId: expected.catalogId, sectionId: expected.sectionId, groupId: expected.groupId, slug: expected.slug, estimatedMinutes: expected.estimatedMinutes, defaultPriority: expected.defaultPriority, difficulty: expected.difficulty, sortOrder: expected.sortOrder, prerequisiteIds: expected.prerequisiteIds })
    }
    expect(data.progress).toEqual([])
    expect(data.plans).toEqual([])
    expect(data.revision).toBe(0)
  })
  it("persists progress and does not double-add minutes when the request is retried", async () => {
    const request = randomUUID()
    const first = await mutate("progress", progress, 0, request)
    const second = await mutate("progress", progress, 0, request)
    expect(first.progress[0].accumulatedMinutes).toBe(25)
    expect(second.revision).toBe(1)
    expect((await snapshot()).progress[0].accumulatedMinutes).toBe(25)
  })
  it("rejects stale writes", async () => {
    await mutate("progress", progress, 0)
    await expect(mutate("progress", { ...progress, minutesStudied: 20 }, 0)).rejects.toMatchObject({ code: "40001" })
  })
  it("keeps preferences and progress private through RLS", async () => {
    await mutate("progress", progress, 0)
    await mutate("preferences", { preferences }, 1)
    await asUser(userB)
    expect((await snapshot()).progress).toEqual([])
    expect((await db.query("select * from public.topic_progress")).rows).toEqual([])
    expect((await db.query("select * from public.study_preferences")).rows).toEqual([])
  })
  it("prevents ordinary users from changing the shared catalog", async () => {
    await expect(db.exec("update public.syllabus_topics set title = 'forged'")).rejects.toMatchObject({ code: "42501" })
  })
  it("prevents bypassing the atomic progress boundary", async () => {
    await expect(db.exec("delete from public.topic_progress")).rejects.toMatchObject({ code: "42501" })
  })
  it("denies anonymous mutation access", async () => {
    await db.exec("reset role; set role anon")
    await expect(mutate("progress", progress, 0)).rejects.toMatchObject({ code: "42501" })
  })
  it.each([
    { ...progress, confidence: 6 }, { ...progress, priority: 0 }, { ...progress, minutesStudied: -1 },
    { ...progress, status: "mastered" }, { ...progress, topicId: "unknown" },
  ])("rejects invalid progress at the database boundary %#", async (payload) => {
    await expect(mutate("progress", payload, 0)).rejects.toThrow()
  })
  it("persists plans, records completion, and preserves it during regeneration", async () => {
    const payload = await planPayload()
    const created = await mutate("plan", payload, 0)
    const task = created.plans[0].tasks[0]
    const finished = await mutate("task", { taskId: task.id, status: "completed" }, 1)
    expect(finished.progress).toEqual([]) // Completing one study block never invents mastery.
    const regenerated = await mutate("plan", { ...payload, tasks: [payload.tasks[1]] }, 2)
    expect(regenerated.plans).toHaveLength(1)
    expect(regenerated.plans[0].tasks[0]).toMatchObject({ id: task.id, status: "completed" })
    expect(regenerated.plans[0].totalMinutes).toBe(60)
  })
  it("denies completing another user's task", async () => {
    const data = await mutate("plan", await planPayload(), 0)
    await asUser(userB)
    await expect(mutate("task", { taskId: data.plans[0].tasks[0].id, status: "completed" }, 0)).rejects.toMatchObject({ code: "42501" })
  })
  it("rejects duplicate tasks and budget overflow as a whole transaction", async () => {
    const payload = await planPayload()
    await db.exec("savepoint failure")
    await expect(mutate("plan", { ...payload, tasks: [...payload.tasks, { ...payload.tasks[0], position: 3 }] }, 0)).rejects.toThrow()
    await db.exec("rollback to savepoint failure")
    expect((await snapshot()).plans).toEqual([])
    expect((await snapshot()).revision).toBe(0)
    await expect(mutate("plan", { ...payload, preferences: { ...preferences, dailyMinutes: 30 } }, 0)).rejects.toThrow()
  })
})
