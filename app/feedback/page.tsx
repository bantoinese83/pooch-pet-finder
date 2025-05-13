"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { MessageCircle, Sparkles } from "lucide-react"
import Image from "next/image"


export default function FeedbackPage() {
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from("feedback").insert([{ message }])
    setLoading(false)
    setSubmitted(true)
    setMessage("")
  }

  return (
    <main className="max-w-lg mx-auto py-12 px-4">
      <div className="flex flex-col items-center mb-8">
        <span className="inline-flex items-center gap-2 mb-2">
          <MessageCircle className="h-10 w-10 text-amber-600 animate-bounce" />
          <h1 className="text-4xl font-extrabold text-amber-800 drop-shadow-lg tracking-tight">Feedback</h1>
        </span>
        <p className="text-amber-700 text-center max-w-md">We love hearing from you! Share your thoughts, suggestions, or let us know how we can improve POOCH Pet Finder.</p>
      </div>
      <div className="bg-white/80 border border-amber-100 rounded-2xl shadow-lg p-8">
        {submitted ? (
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="h-8 w-8 text-green-500 animate-pulse" />
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-green-800 text-center font-semibold">
              Thank you for your feedback!
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="feedback-message" className="block font-semibold text-amber-700">Your Feedback</label>
            <textarea
              id="feedback-message"
              className="w-full border border-amber-200 rounded-lg p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/40"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              aria-label="Your feedback"
            />
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white w-full font-bold shadow" disabled={loading} aria-busy={loading} aria-label="Submit Feedback">
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
} 