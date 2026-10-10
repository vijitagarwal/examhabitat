import { WorkspaceFrame } from "@/components/workspace/workspace-frame"
import { WorkspaceState } from "@/components/workspace/workspace-state"
import { WorkspaceClient } from "@/components/workspace/workspace-client"
import { loadCatWorkspace } from "@/lib/server/workspace"

export const dynamic = "force-dynamic"
export default async function PlanPage() {
  const result = await loadCatWorkspace()
  return <WorkspaceFrame activePath="/dashboard/plan" signedIn={result.kind === "ready"}>{result.kind === "ready" ? <WorkspaceClient initialData={result.data} view="plan" /> : <WorkspaceState kind={result.kind} message={result.message} />}</WorkspaceFrame>
}
