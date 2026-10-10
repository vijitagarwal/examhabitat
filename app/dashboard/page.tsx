import { WorkspaceFrame } from "@/components/workspace/workspace-frame"
import { WorkspaceState } from "@/components/workspace/workspace-state"
import { DashboardOverview } from "@/components/workspace/dashboard-overview"
import { loadCatWorkspace } from "@/lib/server/workspace"

export const dynamic = "force-dynamic"
export default async function DashboardPage() {
  const result = await loadCatWorkspace()
  return <WorkspaceFrame activePath="/dashboard" signedIn={result.kind === "ready"}>{result.kind === "ready" ? <DashboardOverview data={result.data} /> : <WorkspaceState kind={result.kind} message={result.message} />}</WorkspaceFrame>
}
