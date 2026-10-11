"use client"

import { useEffect, useRef, useState } from "react"
import { remainingSeconds } from "@/lib/practice"

export function SessionTimer({ deadline, serverNow, onExpire }: { deadline: string; serverNow: string; onExpire: () => void }) {
  const [seconds, setSeconds] = useState(remainingSeconds(deadline, serverNow) ?? 0)
  const callback = useRef(onExpire)
  const notified = useRef(false)
  useEffect(() => { callback.current = onExpire }, [onExpire])
  useEffect(() => {
    const wall = Date.now(), monotonic = performance.now()
    const tick = () => {
      // Wall elapsed covers browser/OS sleep; monotonic elapsed resists backwards clock changes.
      const elapsed = Math.max(Date.now() - wall, performance.now() - monotonic)
      const left = remainingSeconds(deadline, serverNow, elapsed) ?? 0
      setSeconds(left)
      if (!left && !notified.current) { notified.current = true; callback.current() }
    }
    tick()
    const interval = setInterval(tick, 1000)
    document.addEventListener("visibilitychange", tick)
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", tick) }
  }, [deadline, serverNow])
  const warning = seconds === 0 ? "Time is up. Checking the saved result." : seconds <= 60 ? "One minute or less remains." : seconds <= 300 ? "Five minutes or less remain." : ""
  return <div className="rounded-xl border border-line bg-surface p-4"><p role="timer" aria-label="Time remaining" aria-live="off" className="font-mono text-xl">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</p><p className="text-xs text-muted">Server deadline · timer does not pause</p><p role="status" className="mt-1 text-sm font-semibold">{warning}</p></div>
}
