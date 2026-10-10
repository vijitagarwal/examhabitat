"use client"

import { useRef, useState } from "react"
import type { ActionResult, CatWorkspaceData } from "@/lib/workspace"

export function useWorkspaceMutation(onSaved: (data: CatWorkspaceData) => void) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)
  const lock = useRef(false)
  const receipt = useRef<{ signature: string; requestId: string } | null>(null)

  async function run(action: (input: unknown) => Promise<ActionResult<CatWorkspaceData>>, payload: unknown, revision: number, success: string) {
    if (lock.current) return false
    lock.current = true
    setPending(true)
    setMessage(null)
    const signature = JSON.stringify({ payload, revision })
    if (receipt.current?.signature !== signature) receipt.current = { signature, requestId: crypto.randomUUID() }
    try {
      const result = await action({ payload, expectedRevision: revision, requestId: receipt.current.requestId })
      if (!result.ok) { setMessage({ error: true, text: result.message }); return false }
      onSaved(result.data)
      receipt.current = null
      setMessage({ error: false, text: success })
      return true
    } catch {
      setMessage({ error: true, text: "The save was interrupted. Retry the same submission or reload to check saved data." })
      return false
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  return { pending, message, run }
}
