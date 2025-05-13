import React from "react"
import { AnimatedCounter } from "@/components/ui/animated-counter"

interface StatsCardProps {
  icon: React.ReactNode
  value: number | string
  label: string
  colorClass?: string
  valueClass?: string
  className?: string
}

export function StatsCard({ icon, value, label, colorClass = "", valueClass = "", className = "" }: StatsCardProps) {
  return (
    <div className={`rounded-xl p-6 flex flex-col items-center shadow border bg-white ${colorClass} ${className}`}>
      <div className="mb-2">{icon}</div>
      <AnimatedCounter value={typeof value === 'number' ? value : parseInt(value as string) || 0} className={`text-2xl font-bold ${valueClass}`} />
      <div className={`text-sm font-medium ${colorClass}`}>{label}</div>
    </div>
  )
} 