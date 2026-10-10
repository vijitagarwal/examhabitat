"use client"

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-xl p-10"><h1 className="text-2xl font-semibold">Workspace unavailable</h1><p className="mt-3 text-muted">We could not finish loading your saved data. Please retry.</p><button onClick={reset} className="mt-5 min-h-11 rounded-xl bg-accent px-5 text-white">Try again</button></main>
}
