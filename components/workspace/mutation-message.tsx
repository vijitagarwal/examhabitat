"use client"

export function MutationMessage({ message }: { message: { error: boolean; text: string } | null }) {
  if (!message) return null
  return <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.error ? "bg-red-50 text-danger" : "bg-accent-soft text-accent-strong"}`}>
    <p role={message.error ? "alert" : "status"}>{message.text}</p>
    {message.error && <button type="button" className="mt-2 min-h-10 font-semibold underline" onClick={() => window.location.reload()}>Reload saved workspace (discards this draft)</button>}
  </div>
}
