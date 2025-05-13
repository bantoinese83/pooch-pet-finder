"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Sparkles } from "lucide-react"

export function FaqList({ title = "Frequently Asked Questions", className = "" }: { title?: string; className?: string }) {
  const [faqs, setFaqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFaqs() {
      setLoading(true)
      const { data } = await supabase.from("faqs").select("*").order("created_at", { ascending: true })
      setFaqs(data || [])
      setLoading(false)
    }
    fetchFaqs()
  }, [])

  return (
    <div className={className}>
      <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2 text-amber-700"><Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />{title}</h2>
      {loading ? (
        <div className="text-amber-700">Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div className="text-gray-500">No FAQs yet.</div>
      ) : (
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {faqs.map((faq: any, i: number) => (
            <AccordionItem value={`item-${faq.id}`} key={faq.id}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

export function useFaqs() {
  const [faqs, setFaqs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFaqs() {
      setLoading(true)
      const { data } = await supabase.from("faqs").select("*").order("created_at", { ascending: true })
      setFaqs(data || [])
      setLoading(false)
    }
    fetchFaqs()
  }, [])

  return { faqs, loading }
} 