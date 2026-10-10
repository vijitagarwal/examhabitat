import { ArrowRight, CircleGauge, Sparkles } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/button"

const principles = ["Practice with a clear purpose", "Review the evidence behind mistakes", "Build momentum through small, repeatable actions"]

export default function HomePage() {
  return <main className="min-h-screen">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10"><BrandMark /><Button href="/auth" variant="ghost">Sign in <ArrowRight className="ml-2 size-4" /></Button></header>
    <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-32 lg:pt-24">
      <div className="max-w-2xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-accent"><Sparkles className="size-3.5" /> Preparation with evidence</div><h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-7xl">Study less randomly. Improve more deliberately.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-muted">ExamHabitat turns your practice, review, and weak areas into one calm preparation workspace. Start with a focused CAT vertical slice built around real progress.</p><div className="mt-9 flex flex-wrap gap-3"><Button href="/auth">Create your workspace <ArrowRight className="ml-2 size-4" /></Button><Button href="/auth" variant="secondary">Explore the CAT setup</Button></div></div>
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-[0_24px_80px_rgba(40,88,70,.12)] sm:p-8"><div className="flex items-center justify-between border-b border-line pb-5"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted">Your preparation cockpit</p><p className="mt-2 text-xl font-semibold">A clear next action</p></div><CircleGauge className="size-7 text-accent" /></div><div className="mt-7 rounded-2xl bg-accent-soft p-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-accent-strong">Today</p><p className="mt-3 text-2xl font-semibold">Practice 8 DILR questions</p><p className="mt-2 text-sm leading-6 text-muted">A focused 25-minute session based on your recent accuracy and review backlog.</p><Button href="/auth" className="mt-5 bg-accent-strong">Start a session</Button></div><div className="mt-6 grid grid-cols-3 gap-3">{[["42%", "Topics active"], ["8", "Review queue"], ["25m", "Next focus"]].map(([value, label]) => <div key={label} className="rounded-xl border border-line p-3"><p className="text-lg font-semibold">{value}</p><p className="mt-1 text-xs text-muted">{label}</p></div>)}</div></div>
    </section>
    <section className="border-y border-line bg-surface"><div className="mx-auto grid max-w-7xl gap-6 px-6 py-14 sm:grid-cols-3 lg:px-10">{principles.map((item, index) => <div key={item} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{index + 1}</span><p className="font-medium leading-6">{item}</p></div>)}</div></section>
    <footer className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-sm text-muted lg:px-10"><span>CAT first. Other exams when ready.</span><span>© 2026 ExamHabitat</span></footer>
  </main>
}
