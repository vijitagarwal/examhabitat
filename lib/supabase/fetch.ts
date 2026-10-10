// Bound each network request without swallowing cancellation or fabricating a result.
export const SUPABASE_REQUEST_TIMEOUT_MS = 20_000
export const supabaseFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController()
  const original = init?.signal ?? (input instanceof Request ? input.signal : undefined)
  const abort = () => controller.abort(original?.reason)
  if (original?.aborted) abort()
  else original?.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    // RPC/auth payloads are small JSON documents. Consume the body inside the deadline
    // as well, so receiving headers alone cannot leave a save waiting indefinitely.
    const body = await response.arrayBuffer()
    return new Response(body.byteLength ? body : null, { status: response.status, statusText: response.statusText, headers: response.headers })
  }
  finally {
    clearTimeout(timeout)
    original?.removeEventListener("abort", abort)
  }
}
