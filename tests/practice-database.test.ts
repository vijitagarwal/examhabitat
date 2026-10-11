// @vitest-environment node
import { PGlite } from "@electric-sql/pglite"
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto"
import { readFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { attemptSchema, bankSchema, historySchema, mistakesSchema, scoreAnswers, type ScoringItem } from "@/lib/practice"

const A = "00000000-0000-4000-8000-000000000001", B = "00000000-0000-4000-8000-000000000002"
let db: PGlite
async function user(id = A) { await db.exec("reset role; set role authenticated"); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]) }
async function rpc(name: string, args: unknown[] = []) {
  const { rows } = await db.query<{ data: unknown }>(`select public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")}) data`, args)
  return rows[0].data
}
const setup = (overrides = {}) => ({ requestId: randomUUID(), filters: {}, questionIds: ["cat-p-017", "cat-p-018"], count: 2, mode: "practice", minutes: 10, policy: "standard", ...overrides })
async function start(input = setup()) { return attemptSchema.parse(await rpc("start_practice", [JSON.stringify(input)])) }
async function command(id: string, revision: number, operation = "save", questionId = "cat-p-017", answer: string | null = "1080", skipped = false, requestId = randomUUID()) {
  return attemptSchema.parse(await rpc("command_practice", [JSON.stringify({ attemptId: id, requestId, revision, operation, answer: questionId ? { questionId, answer, skipped } : null })]))
}
beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`)
  for (const name of ["0001_foundation", "0002_cat_syllabus_progress_plans", "0003_atomic_cat_workspace", "0004_cat_practice_engine", "0005_original_cat_practice"]) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8"))
  }
  await db.query("insert into auth.users values ($1),($2)", [A, B])
  await user()
  await rpc("browse_practice", ["{}", 0]) // Warm WASM query compilation in the explicitly bounded setup hook.
}, 60000)
beforeEach(async () => { await db.exec("begin"); await user() })
afterEach(async () => { await db.exec("rollback; reset role") })
afterAll(async () => { await db?.close() })

describe("actual practice migrations, ownership and atomic scoring", () => {
  it("publishes 32 valid original questions with coherent sets and bounded discovery", async () => {
    const all = []
    for (let page = 0; page < 3; page++) {
      const bank = bankSchema.parse(await rpc("browse_practice", ["{}", page]))
      expect(bank.total).toBe(32); expect(bank.questions.length).toBeLessThanOrEqual(12)
      all.push(...bank.questions)
    }
    expect(all.filter((q) => q.question.section === "QA")).toHaveLength(16)
    expect(all.filter((q) => q.question.stimulus?.kind === "passage")).toHaveLength(4)
    expect(all.filter((q) => q.question.stimulus?.kind === "case")).toHaveLength(8)
    expect(JSON.stringify(all)).not.toMatch(/answer_key|explanation/)
  })
  it("composes bank filters and returns empty results honestly", async () => {
    expect(bankSchema.parse(await rpc("browse_practice", [JSON.stringify({ section: "QA", type: "numeric", search: "price" }), 0])).total).toBe(1)
    expect(bankSchema.parse(await rpc("browse_practice", [JSON.stringify({ section: "VARC", search: "price" }), 0])).total).toBe(0)
  })
  it("keeps keys inaccessible through raw tables and helper RPCs", async () => {
    for (const sql of ["select * from public.practice_questions", "select * from public.practice_attempt_items", "select public.practice_score(gen_random_uuid())", "update public.practice_questions set answer_key='A'"]) {
      await db.exec("savepoint denied")
      await expect(db.exec(sql)).rejects.toMatchObject({ code: "42501" })
      await db.exec("rollback to savepoint denied")
    }
  })
  it("creates once on retry and rejects changed setup for the same receipt", async () => {
    const input = setup(); const first = await start(input)
    expect((await start(input)).id).toBe(first.id)
    expect(first.items.every((i) => i.key === null && i.explanation === null)).toBe(true)
    await expect(start({ ...input, minutes: 20 })).rejects.toMatchObject({ code: "22023" })
  })
  it("persists, changes and clears an answer without exposing correctness", async () => {
    const a = await start()
    const saved = await command(a.id, 0)
    expect(saved.items[0]).toMatchObject({ answer: "1080", outcome: null, key: null })
    expect((await command(a.id, 1, "save", "cat-p-017", "1000")).items[0].answer).toBe("1000")
    await command(a.id, 2, "save", "cat-p-017", null)
    expect(attemptSchema.parse(await rpc("read_practice_attempt", [a.id])).items[0].answer).toBeNull()
  })
  it("retries saves exactly once and rejects stale drafts", async () => {
    const a = await start(); const request = randomUUID()
    await command(a.id, 0, "save", "cat-p-017", "1080", false, request)
    expect((await command(a.id, 0, "save", "cat-p-017", "1080", false, request)).revision).toBe(1)
    await expect(command(a.id, 0)).rejects.toMatchObject({ code: "40001" })
  })
  it("rejects out-of-scope questions and invalid formats without partial saves", async () => {
    const a = await start()
    for (const [id, answer] of [["cat-p-001", "A"], ["cat-p-017", "1e3"], ["cat-p-018", "E"]]) {
      await db.exec("savepoint invalid")
      await expect(command(a.id, 0, "save", id, answer)).rejects.toMatchObject({ code: "22023" })
      await db.exec("rollback to savepoint invalid")
    }
    expect(attemptSchema.parse(await rpc("read_practice_attempt", [a.id])).revision).toBe(0)
  })
  it("finalizes atomically with the last draft and cannot create a second result", async () => {
    const a = await start(); await command(a.id, 0)
    const final = await command(a.id, 1, "submit", "cat-p-018", "A")
    expect(final.result).toMatchObject({ score: 2, correct: 1, incorrect: 1, accuracy: 50, attempted: 2 })
    expect(final.items[0]).toMatchObject({ key: "1080", outcome: "correct" })
    expect((await command(a.id, 0, "submit", "", null)).result).toEqual(final.result)
    await expect(command(a.id, 2)).rejects.toMatchObject({ code: "40001" })
  })
  it("makes submission failure atomic including its final draft", async () => {
    const a = await start(); await db.exec("savepoint submit")
    await expect(command(a.id, 0, "submit", "cat-p-018", "invalid")).rejects.toThrow()
    await db.exec("rollback to savepoint submit")
    expect(attemptSchema.parse(await rpc("read_practice_attempt", [a.id]))).toMatchObject({ status: "active", revision: 0, result: null })
  })
  it("uses a fixed deadline and expires without accepting a late answer", async () => {
    const a = await start(setup({ mode: "timed", minutes: 1 }))
    expect(attemptSchema.parse(await rpc("read_practice_attempt", [a.id])).deadline).toBe(a.deadline)
    await db.exec("reset role")
    await db.query("update public.practice_attempts set started_at=clock_timestamp()-interval '2 minutes',deadline=clock_timestamp()-interval '1 minute' where id=$1", [a.id])
    await user()
    const expired = await command(a.id, 0)
    expect(expired.status).toBe("expired"); expect(expired.items[0].answer).toBeNull()
    expect(expired.result).toMatchObject({ score: 0, unanswered: 2, elapsedSeconds: 60 })
  })
  it("enforces cross-user denial on reads, saves, submissions and reviews", async () => {
    const a = await start(); await command(a.id, 0, "submit", "cat-p-017", "1")
    await user(B)
    expect(historySchema.parse(await rpc("practice_history", [0, false, false])).total).toBe(0)
    expect((await db.query("select * from public.practice_answers")).rows).toEqual([])
    for (const operation of [() => rpc("read_practice_attempt", [a.id]), () => command(a.id, 0), () => command(a.id, 0, "submit"), () => rpc("mark_practice", ["cat-p-017", a.id, true])]) {
      await db.exec("savepoint ownership"); await expect(operation()).rejects.toMatchObject({ code: "42501" }); await db.exec("rollback to savepoint ownership")
    }
  })
  it("denies missing authentication and anonymous execution", async () => {
    await user(""); await db.exec("savepoint auth")
    await expect(start()).rejects.toMatchObject({ code: "42501" }); await db.exec("rollback to savepoint auth; reset role; set role anon")
    await expect(rpc("browse_practice", ["{}", 0])).rejects.toMatchObject({ code: "42501" })
  })
  it("preserves historical mistakes when a retry is correct, and tracks review separately", async () => {
    const first = await start(setup({ questionIds: ["cat-p-017"] })); await command(first.id, 0, "submit", "cat-p-017", "1")
    const retry = await start(setup({ questionIds: ["cat-p-017"] })); await command(retry.id, 0, "submit")
    expect(mistakesSchema.parse(await rpc("practice_history", [0, true, false])).total).toBe(1)
    await rpc("mark_practice", ["cat-p-017", first.id, true])
    expect(mistakesSchema.parse(await rpc("practice_history", [0, true, true])).total).toBe(0)
    expect(attemptSchema.parse(await rpc("read_practice_attempt", [first.id])).items[0]).toMatchObject({ outcome: "incorrect", reviewed: true })
  })
  it("keeps bookmarks private and makes set-state retries idempotent", async () => {
    await rpc("mark_practice", ["cat-p-017", null, true]); await rpc("mark_practice", ["cat-p-017", null, true])
    expect(bankSchema.parse(await rpc("browse_practice", ['{"history":"bookmarked"}', 0])).total).toBe(1)
    await user(B); expect(bankSchema.parse(await rpc("browse_practice", ['{"history":"bookmarked"}', 0])).total).toBe(0)
  })
  it("stores no mastery changes and derives recent practice evidence", async () => {
    for (let n = 0; n < 3; n++) { const a = await start(setup({ questionIds: ["cat-p-017"] })); await command(a.id, 0, "submit", "cat-p-017", "1") }
    expect(await rpc("practice_signals")).toEqual([{ topicId: "cat-qa-arithmetic-percentages", attempted: 3, incorrect: 3 }])
    expect((await db.query("select * from public.topic_progress")).rows).toEqual([])
  })
  it("reproduces trusted SQL results with the deterministic TypeScript scorer", async () => {
    const a = await start(); await command(a.id, 0, "save", "cat-p-017", " +001080.000 ")
    const final = await command(a.id, 1, "submit", "cat-p-018", null, true)
    const items: ScoringItem[] = final.items.map((i) => ({ section: i.question.section, type: i.question.type, key: i.key!, answer: i.answer, skipped: i.skipped }))
    const { outcomes, ...counts } = scoreAnswers(items, final.policy)
    expect(final.result).toMatchObject(counts)
    expect(final.items.map((i) => i.outcome)).toEqual(outcomes)
  })
  it("freezes content and keys across later question updates", async () => {
    const a = await start(); await db.exec("reset role")
    await db.exec("update public.practice_questions set answer_key='2',version=2 where id='cat-p-017'")
    await user(); const final = await command(a.id, 0, "submit")
    expect(final.items[0]).toMatchObject({ key: "1080", outcome: "correct", question: { version: 1 } })
  })
  it("checks all authored keys independently against reviewed calculations and logic", async () => {
    await db.exec("reset role")
    const { rows } = await db.query<{ answer_key: string }>("select answer_key from public.practice_questions order by id")
    // RC/VA answers follow the explicit textual logic; DILR enumerates two legal schedules.
    const expected = ["B","C","A","D","C","A","3","A","B",String(60+75+100),"C",String(235*1.2),"B","2","D","C",
      String(1200*1.2*0.75),"C",String((5*18-22)/4),"B",String(36/5),String(6/30*100),"C",String(10**2-2*21),"A",String(5+11*4),"B",String(2*22),"C",String(12*180/36),String(6*5/2),String(3/5*2/4)]
    expect(rows.map((r) => r.answer_key)).toEqual(expected)
  })
})
