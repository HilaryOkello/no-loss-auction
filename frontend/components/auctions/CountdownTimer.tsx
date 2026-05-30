"use client"

import { useEffect, useState } from "react"

function formatCountdown(s: number): string {
  if (s <= 0) return "Ended"
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export function CountdownTimer({ deadline }: { deadline: number }) {
  const [left, setLeft] = useState(Math.max(0, deadline - Math.floor(Date.now() / 1000)))

  useEffect(() => {
    const t = setInterval(
      () => setLeft(Math.max(0, deadline - Math.floor(Date.now() / 1000))),
      1000
    )
    return () => clearInterval(t)
  }, [deadline])

  const ended = left === 0
  return (
    <span
      className={`text-xs font-mono font-medium ${
        ended ? "text-red-500" : left < 3600 ? "text-amber-600" : "text-slate-500"
      }`}
    >
      {ended ? "Ended" : `⏱ ${formatCountdown(left)}`}
    </span>
  )
}
