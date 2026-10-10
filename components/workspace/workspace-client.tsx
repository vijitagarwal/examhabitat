"use client"

import { useState } from "react"
import type { CatWorkspaceData } from "@/lib/workspace"
import { SyllabusExplorer } from "./syllabus-explorer"
import { StudyPlanner } from "./study-planner"

export function WorkspaceClient({ initialData, view }: { initialData: CatWorkspaceData; view: "syllabus" | "plan" }) {
  const [data, setData] = useState(initialData)
  return view === "syllabus" ? <SyllabusExplorer data={data} onSaved={setData} /> : <StudyPlanner data={data} onSaved={setData} />
}
