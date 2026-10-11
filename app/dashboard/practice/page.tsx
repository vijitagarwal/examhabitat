import { WorkspaceFrame } from "@/components/workspace/workspace-frame"
import { PracticeFailure, PracticeLinks } from "@/components/practice/practice-shared"
import { QuestionBank } from "@/components/practice/question-bank"
import { browsePractice } from "@/lib/server/practice"
import { bankFilterSchema } from "@/lib/practice"
import { catTopics, catSections } from "@/lib/cat-syllabus"

export const dynamic = "force-dynamic"
export default async function PracticePage({ searchParams }: { searchParams: Promise<{ topicId?: string }> }) {
  const query = await searchParams
  const filters = bankFilterSchema.parse({ topicId: typeof query.topicId === "string" && query.topicId.length <= 100 ? query.topicId : "" })
  const result = await browsePractice({ filters, page: 0 })
  const topics = catTopics.map((t) => ({ id: t.id, title: t.title, section: catSections.find((s) => s.id === t.sectionId)?.code ?? "QA" }))
  return <WorkspaceFrame activePath="/dashboard/practice" signedIn={result.ok}><PracticeLinks />{result.ok ? <QuestionBank key={filters.topicId} initial={result.data} initialFilters={filters} topics={topics} /> : <PracticeFailure code={result.code} message={result.message} />}</WorkspaceFrame>
}
