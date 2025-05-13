"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { askGeminiFAQ } from "@/lib/gemini"
import { Button } from "@/components/ui/button"
import { HelpCircle, Sparkles } from "lucide-react"
import Image from "next/image"



export default function HelpPage() {
  const [faqs, setFaqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFaqs() {
      setLoading(true)
      const { data } = await supabase.from("faqs").select("*").order("created_at", { ascending: true })
      setFaqs(data || [])
      setLoading(false)
    }
    fetchFaqs()
  }, [])

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    setChatLoading(true)
    setChatError(null)
    setAnswer(null)
    try {
      const aiAnswer = await askGeminiFAQ(question)
      setAnswer(aiAnswer ?? null)
    } catch {
      setChatError("AI could not answer your question. Please try again.")
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex flex-col items-center mb-8">
        <span className="inline-flex items-center gap-2 mb-2">
          <HelpCircle className="h-10 w-10 text-amber-600 animate-bounce" />
          <h1 className="text-4xl font-extrabold text-amber-800 drop-shadow-lg tracking-tight">Help Center & FAQ</h1>
        </span>
        <p className="text-amber-700 text-center max-w-xl">Need help? Ask a question or browse our frequently asked questions. Our AI and team are here to help you with anything POOCH Pet Finder!</p>
      </div>
      <section className="mb-10 bg-white/80 border border-amber-100 rounded-2xl shadow-lg p-8">
        <form onSubmit={handleAsk} className="flex flex-col md:flex-row gap-2 items-stretch mb-4">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 border border-amber-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/40"
            aria-label="Ask a question"
            required
          />
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow" disabled={chatLoading || !question.trim()} aria-busy={chatLoading}>
            {chatLoading ? "Thinking..." : "Ask"}
          </Button>
        </form>
        {chatError && <div className="text-red-600 text-sm mb-2">{chatError}</div>}
        {answer && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 mb-4">
            <b>AI Answer:</b> {answer}
          </div>
        )}
      </section>
      <h2 className="text-2xl font-semibold text-amber-700 mb-4 flex items-center gap-2"><Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />Frequently Asked Questions</h2>
      <div className="space-y-4">
        {loading ? (
          <div className="text-amber-700">Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className="text-gray-500">No FAQs yet.</div>
        ) : (
          faqs.map((faq: any, i: number) => (
            <details key={faq.id} className="bg-white rounded-lg shadow p-4 group" open={i === 0}>
              <summary className="font-semibold text-amber-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400" tabIndex={0} aria-expanded={i === 0 ? "true" : "false"}>{faq.question}</summary>
              <div className="mt-2 text-gray-700">{faq.answer}</div>
            </details>
          ))
        )}
      </div>
    </main>
  )
} 