import { PerformanceDashboard } from "@/components/analytics/performance-dashboard"
import { PracticeFailure, PracticeLinks } from "@/components/practice/practice-shared"
import { WorkspaceFrame } from "@/components/workspace/workspace-frame"
import { readPerformanceAnalytics } from "@/lib/server/analytics"

export const dynamic = "force-dynamic"
export default async function PerformancePage() {
  const result = await readPerformanceAnalytics()
  return <WorkspaceFrame activePath="/dashboard/performance" signedIn={result.ok}><PracticeLinks />{result.ok ? <PerformanceDashboard data={result.data} /> : <PracticeFailure code={result.code} message={result.message} />}</WorkspaceFrame>
}
