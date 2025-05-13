"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

interface GlobalAlertData {
  id: string
  message: string
  type: "info" | "warning" | "error"
  active: boolean
}

export function GlobalAlert() {
  const [alert, setAlert] = useState<GlobalAlertData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if alert was dismissed
    const dismissedId = localStorage.getItem("globalAlertDismissed")
    if (dismissedId && alert && alert.id === dismissedId) {
      setDismissed(true)
    }
  }, [alert])

  useEffect(() => {
    async function fetchAlert() {
      const { data, error } = await supabase
        .from("global_alerts")
        .select("id, message, type, active")
        .eq("active", true)
        .order("id", { ascending: false })
        .limit(1)
        .single()
      if (!error && data) {
        setAlert(data)
      }
    }
    fetchAlert()
  }, [])

  if (!alert || dismissed) return null

  let bgColor = "bg-blue-100 text-blue-900 border-blue-300"
  if (alert.type === "warning") bgColor = "bg-yellow-100 text-yellow-900 border-yellow-300"
  if (alert.type === "error") bgColor = "bg-red-100 text-red-900 border-red-300"

  return (
    <div className={`w-full border-b p-4 flex flex-col md:flex-row items-center justify-between ${bgColor} z-50`}>
      <div className="flex flex-col md:flex-row items-center gap-4 w-full">
        <span>{alert.message}</span>
        {/* Action buttons removed as requested */}
      </div>
      <button
        aria-label="Dismiss alert"
        className="ml-4 text-lg font-bold opacity-60 hover:opacity-100"
        onClick={() => {
          setDismissed(true)
          localStorage.setItem("globalAlertDismissed", alert.id)
        }}
      >
        ×
      </button>
    </div>
  )
} 