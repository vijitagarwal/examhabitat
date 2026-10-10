import Link from "next/link"

export function BrandMark() {
  return <Link href="/" className="inline-flex items-center gap-3" aria-label="ExamHabitat home">
    <span className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-bold text-white">EH</span>
    <span className="text-lg font-semibold tracking-tight">ExamHabitat</span>
  </Link>
}
