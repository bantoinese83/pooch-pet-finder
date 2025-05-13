"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { generateCommunityPostSuggestion, summarizeText } from "@/lib/gemini"


const POST_TYPES = [
  { value: "sighting", label: "Sighting" },
  { value: "tip", label: "Tip" },
  { value: "event", label: "Event" },
]

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<string>(POST_TYPES[0].value)
  const [content, setContent] = useState<string>("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [summarized, setSummarized] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      const { data } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await supabase.from("community_posts").insert([{ type, content }])
    setContent("")
    setType(POST_TYPES[0].value)
    setSubmitting(false)
    // Refresh posts
    const { data } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false })
    setPosts(data || [])
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-amber-800 mb-8">Community Board</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-8 space-y-4">
        <div className="flex gap-4 mb-2">
          {POST_TYPES.map((pt) => (
            <Button key={pt.value} type="button" variant={type === pt.value ? "default" : "outline"} onClick={() => setType(pt.value)}>{pt.label}</Button>
          ))}
        </div>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share a sighting, tip, or event..."
          rows={4}
          className="border-amber-200 focus:ring-amber-500"
        />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={aiLoading} onClick={async () => {
            setAiLoading(true)
            setAiError(null)
            try {
              const suggestion = await generateCommunityPostSuggestion(content)
              setContent(suggestion ?? "")
            } catch {
              setAiError("AI suggestion failed. Please try again.")
            } finally {
              setAiLoading(false)
            }
          }}>{aiLoading ? "Suggesting..." : "Suggest a post"}</Button>
          <Button type="button" variant="outline" size="sm" disabled={aiLoading} onClick={async () => {
            setAiLoading(true)
            setAiError(null)
            try {
              const summary = await summarizeText(content)
              setSummarized(summary ?? null)
            } catch {
              setAiError("AI summarization failed. Please try again.")
            } finally {
              setAiLoading(false)
            }
          }}>Summarize</Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={submitting}>{submitting ? "Posting..." : "Post"}</Button>
        </div>
        {aiError && <div className="text-red-600 text-sm mt-1">{aiError}</div>}
        {summarized && <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2 text-amber-800"><b>Summary:</b> {summarized}</div>}
      </form>
      <h2 className="text-2xl font-semibold text-amber-700 mb-4">Recent Posts</h2>
      {loading ? <div className="text-amber-700">Loading posts...</div> : posts.length === 0 ? <div className="text-gray-500">No posts yet.</div> : (
        <ul className="space-y-4">
          {posts.map((post: any) => (
            <li key={post.id} className="bg-amber-50 rounded-lg p-4 shadow">
              <div className="flex gap-2 items-center mb-1">
                <span className="text-xs px-2 py-1 rounded bg-amber-200 text-amber-800 font-semibold uppercase">{post.type}</span>
                <span className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</span>
              </div>
              <div className="text-gray-800 mb-2 whitespace-pre-line">{post.content}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
} 