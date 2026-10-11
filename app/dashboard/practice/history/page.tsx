import { WorkspaceFrame } from "@/components/workspace/workspace-frame"
import { PracticeFailure, PracticeLinks } from "@/components/practice/practice-shared"
import { PracticeHistory } from "@/components/practice/practice-history"
import { readPracticeHistory } from "@/lib/server/practice"

export const dynamic = "force-dynamic"
export default async function HistoryPage() {
  const result = await readPracticeHistory(0)
  return <WorkspaceFrame activePath="/dashboard/practice" signedIn={result.ok}><PracticeLinks />{result.ok ? <PracticeHistory initial={result.data} /> : <PracticeFailure code={result.code} message={result.message} />}</WorkspaceFrame>
}
