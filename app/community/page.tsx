"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { generateCommunityPostSuggestion, summarizeText } from "@/lib/gemini"
import { Sparkles, Users, Lightbulb, Calendar as CalendarIcon, User, ThumbsUp, Heart, Smile } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"


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
  const [filter, setFilter] = useState<string>("all")

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

  // Filtered posts
  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.type === filter)

  // Loading skeleton
  const PostSkeleton = () => (
    <div className="bg-amber-50 rounded-lg p-4 shadow animate-pulse">
      <div className="flex gap-2 items-center mb-2">
        <div className="h-4 w-16 bg-amber-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded ml-2" />
      </div>
      <div className="h-4 w-full bg-gray-200 rounded mb-1" />
      <div className="h-4 w-2/3 bg-gray-200 rounded" />
    </div>
  )

  // Icon for post type
  const typeIcon = (type: string) => {
    if (type === "sighting") return <Users className="h-5 w-5 text-amber-600" />
    if (type === "tip") return <Lightbulb className="h-5 w-5 text-amber-600" />
    if (type === "event") return <CalendarIcon className="h-5 w-5 text-amber-600" />
    return null
  }

  return (
    <main className="max-w-3xl mx-auto py-12 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-amber-600 animate-pulse" />
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-800">Community Board</h1>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
          {POST_TYPES.map((pt) => (
            <Button key={pt.value} size="sm" variant={filter === pt.value ? "default" : "outline"} onClick={() => setFilter(pt.value)}>{pt.label}</Button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-10 sticky top-2 z-10 space-y-4 border border-amber-100">
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
          aria-label="Community post content"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={aiLoading} aria-label="Suggest a post" onClick={async () => {
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
          <Button type="button" variant="outline" size="sm" disabled={aiLoading} aria-label="Summarize post" onClick={async () => {
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
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white focus:ring-2 focus:ring-amber-500" disabled={submitting} aria-label="Post to community">{submitting ? "Posting..." : "Post"}</Button>
        </div>
        {aiError && <div className="text-red-600 text-sm mt-1">{aiError}</div>}
        {summarized && <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2 text-amber-800"><b>Summary:</b> {summarized}</div>}
      </form>
      <h2 className="text-2xl font-semibold text-amber-700 mb-4">Recent Posts</h2>
      {loading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : filteredPosts.length === 0 ? <div className="text-gray-500">No posts yet.</div> : (
        <ul className="space-y-5">
          <AnimatePresence>
            {filteredPosts.map((post: any) => (
              <motion.li
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-amber-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in focus-within:ring-2 focus-within:ring-amber-500"
                tabIndex={0}
                aria-label={`Community post: ${post.type}`}
              >
                <div className="flex gap-2 items-center mb-1">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold uppercase">
                    {typeIcon(post.type)} {post.type}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(post.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-xs text-gray-700">{post.user_name || "Anonymous"}</span>
                </div>
                <div className="text-gray-800 mb-2 whitespace-pre-line leading-relaxed">{post.content}</div>
                <div className="flex gap-3 mt-2">
                  <button className="flex items-center gap-1 text-amber-700 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 transition-colors" aria-label="Like post"><ThumbsUp className="h-4 w-4" /> <span className="text-xs">Like</span></button>
                  <button className="flex items-center gap-1 text-amber-700 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 transition-colors" aria-label="Helpful post"><Smile className="h-4 w-4" /> <span className="text-xs">Helpful</span></button>
                  <button className="flex items-center gap-1 text-amber-700 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-2 py-1 transition-colors" aria-label="Love post"><Heart className="h-4 w-4" /> <span className="text-xs">Love</span></button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </main>
  )
} 