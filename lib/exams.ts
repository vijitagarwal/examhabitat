import { z } from "zod"

export const examCodeSchema = z.enum(["cat", "neet_ug", "jee_main", "jee_advanced", "upsc_cse", "gate", "clat"])
export type ExamCode = z.infer<typeof examCodeSchema>

export type ExamDefinition = {
  code: ExamCode
  name: string
  shortName: string
  enabled: boolean
  status: "available" | "coming_soon"
  description: string
  sections: string[]
}

export const examDefinitions: ExamDefinition[] = [
  { code: "cat", name: "Common Admission Test", shortName: "CAT", enabled: true, status: "available", description: "A focused first release for structured aptitude preparation.", sections: ["VARC", "DILR", "QA"] },
  { code: "neet_ug", name: "NEET UG", shortName: "NEET UG", enabled: false, status: "coming_soon", description: "Configuration and content validation in progress.", sections: [] },
  { code: "jee_main", name: "JEE Main", shortName: "JEE Main", enabled: false, status: "coming_soon", description: "Configuration and content validation in progress.", sections: [] },
  { code: "jee_advanced", name: "JEE Advanced", shortName: "JEE Advanced", enabled: false, status: "coming_soon", description: "Configuration and content validation in progress.", sections: [] },
  { code: "upsc_cse", name: "UPSC CSE", shortName: "UPSC CSE", enabled: false, status: "coming_soon", description: "Configuration and content validation in progress.", sections: [] },
  { code: "gate", name: "GATE", shortName: "GATE", enabled: false, status: "coming_soon", description: "Configuration and content validation in progress.", sections: [] },
  { code: "clat", name: "CLAT", shortName: "CLAT", enabled: false, status: "coming_soon", description: "Configuration and content validation in progress.", sections: [] },
]

export function getExamDefinition(code: string | null | undefined) {
  const parsed = examCodeSchema.safeParse(code)
  if (!parsed.success) return undefined
  return examDefinitions.find((exam) => exam.code === parsed.data)
}
