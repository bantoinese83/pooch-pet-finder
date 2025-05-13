import React from "react"
import { cn } from "@/lib/utils"

export function Skeleton({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ minHeight: 16, ...style }}
      aria-busy="true"
      aria-label="Loading..."
    />
  )
}
