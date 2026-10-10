import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "ExamHabitat — preparation with evidence",
    template: "%s — ExamHabitat",
  },
  description: "An exam-aware preparation workspace for focused practice, review, and progress.",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
