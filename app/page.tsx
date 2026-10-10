import { ArrowRight, BookOpen, CalendarDays, Target } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/button"
import { catTopics } from "@/lib/cat-syllabus"

export default function HomePage() {
  return <main className="min-h-screen">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10"><BrandMark /><Button href="/auth" variant="ghost">Sign in <ArrowRight className="ml-2 size-4" /></Button></header>
    <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:px-10 lg:pb-28 lg:pt-24">
      <div className="max-w-2xl"><p className="eyebrow">A calmer way to prepare for CAT</p><h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-7xl">Study less randomly.<br />Improve more deliberately.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-muted">Understand your syllabus. Record what you actually know. Build a daily study queue that fits the time you have.</p><Button href="/auth" className="mt-9">Create your workspace <ArrowRight className="ml-2 size-4" /></Button></div>
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-[0_24px_80px_rgba(40,88,70,.12)] sm:p-8">
        <p className="eyebrow">The CAT workspace</p><h2 className="mt-3 text-2xl font-semibold">A clear next action</h2>
        <ol className="mt-7 space-y-6">{[
          { icon: BookOpen, title: "Find your starting point", text: `${catTopics.length} curated topics across VARC, DILR and QA. Search, filter and record your confidence.` },
          { icon: Target, title: "Make progress visible", text: "Save learning states, priorities, review dates and study minutes to your account." },
          { icon: CalendarDays, title: "Plan within your capacity", text: "Get an explainable daily queue. Complete or skip blocks, then return to your saved work." },
        ].map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="size-5" /></span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div></li>)}</ol>
        <p className="mt-7 border-t border-line pt-5 text-xs leading-5 text-muted">This is a preparation taxonomy, not an official or exhaustive syllabus. Question practice and additional exams are future work.</p>
      </div>
    </section>
    <footer className="border-t border-line"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-6 py-8 text-sm text-muted lg:px-10"><span>CAT first. Built around your saved progress.</span><span>ExamHabitat · 2026</span></div></footer>
  </main>
}
