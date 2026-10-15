import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowRight, LoaderCircle, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useExamAuth } from '@/components/exam-dashboard/bridge/useExamAuth';

export const Route = createFileRoute('/auth')({
  component: AuthPage,
});

function AuthPage() {
  const { session, loading, signIn } = useExamAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: '/_authenticated/dashboard', replace: true });
    }
  }, [loading, session, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn(trimmedEmail);
      if (result.error) {
        setError(result.error);
        return;
      }

      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-5 py-3 shadow-2xl shadow-black/30">
          <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
          <span className="text-sm font-medium">Preparing your workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-4 py-10 text-zinc-100">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-10 top-10 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-8 right-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/80 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-8 md:border-b-0 md:border-r">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              ExamHabitat
            </div>

            <h1 className="mt-6 max-w-md text-4xl font-black tracking-tight text-white md:text-5xl">
              Train for your exam with clarity, not chaos.
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-400 md:text-base">
              Turn every mock, topic, and revision habit into a coordinated mission plan. Switch between NEET, CAT, GATE, UPSC, and more without losing momentum.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Target-specific planning and milestones',
                'Topic and mock tracking across each exam',
                'A habit engine that keeps your routine stable',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8 md:p-10">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Welcome back</p>
              <h2 className="mt-2 text-3xl font-extrabold text-white">Sign in</h2>
            </div>

            {isSubmitted ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200">
                <div className="mb-2 flex items-center gap-2 text-base font-semibold text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  Magic link sent
                </div>
                Check your inbox for the secure sign-in link. Once you confirm it, you’ll be returned to your dashboard.
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Email address</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </label>

                {error ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Sending magic link…
                    </>
                  ) : (
                    <>
                      Continue with email
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs leading-6 text-zinc-400">
              No password required. We’ll send a secure one-time sign-in link to your inbox.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
