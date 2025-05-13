"use client"
import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Optionally log error to a service
    // console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 px-4">
      <AlertTriangle className="h-16 w-16 text-red-400 mb-6" />
      <h1 className="text-3xl font-bold text-red-700 mb-2">Something went wrong</h1>
      <p className="text-lg text-amber-900 mb-6 text-center max-w-md">We hit a snag while loading this page. Please try again, or contact support if the problem persists.</p>
      <button
        onClick={() => reset()}
        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg shadow text-lg font-semibold"
      >
        Try Again
      </button>
    </div>
  )
} 