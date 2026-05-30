"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

function formatCountdown(secondsLeft: number): string {
  if (secondsLeft <= 0) return "Ended"
  const h = Math.floor(secondsLeft / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function CountdownTimer({ deadline }: { deadline: number }) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, deadline - Math.floor(Date.now() / 1000))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, deadline - Math.floor(Date.now() / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  const ended = secondsLeft === 0
  return (
    <Badge variant={ended ? "destructive" : "secondary"} className="text-xs">
      {ended ? "Ended" : `⏱ ${formatCountdown(secondsLeft)}`}
    </Badge>
  )
}
