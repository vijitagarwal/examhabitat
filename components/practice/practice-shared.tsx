import Link from "next/link"
import { WorkspaceState } from "@/components/workspace/workspace-state"
import type { ActionFailureCode } from "@/lib/workspace"
import type { PracticeQuestion } from "@/lib/practice"

export function PracticeLinks() {
  return <nav aria-label="Practice navigation" className="mb-6 flex flex-wrap gap-4 text-sm font-semibold text-accent"><Link className="min-h-11 py-3 underline" href="/dashboard/practice">Question bank & setup</Link><Link className="min-h-11 py-3 underline" href="/dashboard/performance">Performance</Link><Link className="min-h-11 py-3 underline" href="/dashboard/practice/history">Attempt history</Link><Link className="min-h-11 py-3 underline" href="/dashboard/practice/mistakes">Mistake review</Link></nav>
}
export function PracticeFailure({ code, message }: { code: ActionFailureCode; message: string }) {
  return <WorkspaceState kind={code === "not_configured" || code === "unauthenticated" ? code : "error"} message={message} />
}
export function QuestionContent({ question }: { question: PracticeQuestion }) {
  return <>
    {question.stimulus && <section aria-label="Shared question material" className="mb-6 rounded-xl bg-surface-muted p-4 sm:p-6">
      <h3 className="text-lg font-semibold">{question.stimulus.title}</h3><p className="mt-3 whitespace-pre-wrap leading-7">{question.stimulus.body}</p>
      {question.stimulus.columns.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><caption className="sr-only">{question.stimulus.title} data</caption><thead><tr>{question.stimulus.columns.map((column, index) => <th scope="col" key={index} className="border border-line p-3">{column}</th>)}</tr></thead><tbody>{question.stimulus.rows.map((row, index) => <tr key={index}>{row.map((cell, col) => col === 0 ? <th scope="row" key={col} className="border border-line p-3">{cell}</th> : <td key={col} className="border border-line p-3">{cell}</td>)}</tr>)}</tbody></table></div>}
    </section>}
    <p className="text-sm text-muted">{question.section} · {question.topicTitle} · Difficulty {question.difficulty}/3 · {question.type === "mcq" ? "Single correct" : "Numeric / TITA"}</p>
    <p className="mt-4 whitespace-pre-wrap text-lg leading-8">{question.prompt}</p>
  </>
}
