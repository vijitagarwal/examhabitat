import { WorkspaceFrame } from "@/components/workspace/workspace-frame"
import { PracticeFailure, PracticeLinks } from "@/components/practice/practice-shared"
import { MistakeHistory } from "@/components/practice/practice-history"
import { readPracticeMistakes } from "@/lib/server/practice"

export const dynamic = "force-dynamic"
export default async function MistakesPage() {
  const result = await readPracticeMistakes({ page: 0, unreviewed: false })
  return <WorkspaceFrame activePath="/dashboard/practice" signedIn={result.ok}><PracticeLinks />{result.ok ? <MistakeHistory initial={result.data} /> : <PracticeFailure code={result.code} message={result.message} />}</WorkspaceFrame>
}
