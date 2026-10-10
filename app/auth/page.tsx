import { AuthForm } from "@/components/auth-form"
import { BrandMark } from "@/components/brand-mark"

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const params = await searchParams
  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="hidden flex-col justify-between bg-accent p-10 text-white lg:flex"><BrandMark /><div className="max-w-md"><p className="text-sm font-semibold uppercase tracking-widest text-white/80">The preparation workspace</p><h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight">Your next improvement should be visible.</h1><p className="mt-6 leading-7 text-white/85">Start with CAT. Save topic progress and build a realistic daily study queue.</p></div><p className="text-sm text-white/80">Your progress belongs to your account.</p></section>
    <section className="flex items-center justify-center px-6 py-12"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><BrandMark /></div><p className="eyebrow">Welcome to ExamHabitat</p><h2 className="mt-3 text-3xl font-semibold">Enter your workspace</h2><p className="mt-3 text-muted">Use your email to receive a secure sign-in link.</p>
      {params.link === "expired" && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-danger">This link could not be verified. It may have expired or opened in a different browser. Request a new link below.</p>}
      <AuthForm /></div></section>
  </main>
}
