"use client"
import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { marked } from "marked"

export default function BlogPostClient({ slug }: { slug: string }) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPost() {
      setLoading(true)
      const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).single()
      setPost(data)
      setLoading(false)
    }
    if (slug) fetchPost()
  }, [slug])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-700">Loading post...</div>
  if (!post) return notFound()

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-amber-800 mb-4">{post.title}</h1>
      <div className="text-sm text-gray-500 mb-6">{new Date(post.created_at).toLocaleDateString()} {post.author_id && <span> | by {post.author_id}</span>}</div>
      <article className="prose prose-amber max-w-none mb-8" dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }} />
      <div className="flex gap-2 mb-8">
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: post.title,
              text: post.content.slice(0, 100),
              url: window.location.href,
            })
          } else {
            navigator.clipboard.writeText(window.location.href)
          }
        }} aria-label="Share Blog Post">
          Share
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    </main>
  )
} 