"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function BlogListClient() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      const { data } = await supabase.from("blog_posts").select("*", { count: "exact" }).order("created_at", { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [])

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-amber-800 mb-8">Blog & Resources</h1>
      {loading ? (
        <div className="text-amber-700">Loading blog posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-gray-500">No blog posts yet.</div>
      ) : (
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: any) => (
            <li key={post.id || post.slug} className="bg-white rounded-xl shadow-md p-6 flex flex-col">
              {post.image_url && (
                <Image src={post.image_url} alt={post.title} width={400} height={250} className="rounded mb-4 object-cover w-full h-48" />
              )}
              <Link href={`/blog/${post.slug}`} className="text-xl font-semibold text-amber-800 hover:underline mb-2" aria-label={post.title}>{post.title}</Link>
              <div className="text-sm text-gray-500 mb-2">{new Date(post.created_at).toLocaleDateString()} {post.author_id && <span> | by {post.author_id}</span>}</div>
              <p className="text-gray-700 line-clamp-3 mb-4">{post.summary || (post.content ? post.content.slice(0, 160) + "..." : "")}</p>
              <div className="flex gap-2 mt-auto">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/blog/${post.slug}`}>Read More</Link>
                </Button>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.summary || post.content?.slice(0, 100),
                      url: window.location.origin + "/blog/" + post.slug,
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.origin + "/blog/" + post.slug)
                  }
                }} aria-label="Share Blog Post">
                  Share
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
} 