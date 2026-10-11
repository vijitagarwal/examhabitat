import { WorkspaceFrame } from "@/components/workspace/workspace-frame"
import { PracticeFailure, PracticeLinks } from "@/components/practice/practice-shared"
import { ActiveSession } from "@/components/practice/active-session"
import { readPractice } from "@/lib/server/practice"

export const dynamic = "force-dynamic"
export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await readPractice(id)
  return <WorkspaceFrame activePath="/dashboard/practice" signedIn={result.ok}><PracticeLinks />{result.ok ? <ActiveSession key={result.data.id} initial={result.data} /> : <PracticeFailure code={result.code} message={result.message} />}</WorkspaceFrame>
}
