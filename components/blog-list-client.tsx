"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { SparklesText } from "@/components/magicui/sparkles-text"
import { DotPattern } from "@/components/magicui/dot-pattern"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

export default function BlogListClient() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [scroll, setScroll] = useState(0)
  // Extract all unique tags from posts
  const tags = Array.from(new Set(posts.flatMap((p: any) => p.tags || []))).filter(Boolean)
  // Featured post: first post
  const featured = posts[0]
  // Filtered posts
  const filtered = posts.filter((post: any) => {
    const matchesTag = !selectedTag || (post.tags || []).includes(selectedTag)
    const matchesSearch = !search || post.title.toLowerCase().includes(search.toLowerCase()) || post.summary?.toLowerCase().includes(search.toLowerCase())
    return matchesTag && matchesSearch
  })
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      const { data } = await supabase.from("blog_posts").select("*", { count: "exact" }).order("created_at", { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [])
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setScroll(Math.min(100, Math.round((window.scrollY / h) * 100)))
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="relative min-h-screen bg-background">
      <DotPattern className="absolute inset-0 z-0 opacity-40" width={24} height={24} cr={1.2} glow />
      <Progress value={scroll} className="fixed top-0 left-0 w-full z-50 h-1 bg-amber-100" />
      <main className="relative z-10 max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-5xl font-bold mb-4 text-center">
          <SparklesText className="inline-block">Blog & Resources</SparklesText>
        </h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2 overflow-x-auto">
            <button onClick={() => setSelectedTag("")} className={`px-3 py-1 rounded-full border ${!selectedTag ? "bg-amber-600 text-white" : "bg-white text-amber-700"}`}>All</button>
            {tags.map(tag => (
              <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-3 py-1 rounded-full border ${selectedTag === tag ? "bg-amber-600 text-white" : "bg-white text-amber-700"}`}>{tag}</button>
            ))}
          </div>
          <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded px-3 py-1 w-full md:w-64 focus:ring-amber-500" />
        </div>
        {loading ? (
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="bg-white rounded-xl shadow-md p-6 flex flex-col">
                <Skeleton className="w-full h-48 mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2 mt-auto">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </li>
            ))}
          </ul>
        ) : posts.length === 0 ? (
          <div className="text-gray-500">No blog posts yet.</div>
        ) : (
          <>
            {featured && (
              <div className="mb-10">
                <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row gap-8 items-center border-2 border-amber-100 hover:shadow-2xl transition-all">
                  {featured.image_url && (
                    <Image src={featured.image_url} alt={featured.title} width={400} height={250} className="rounded-xl object-cover w-full max-w-xs h-48 md:h-64" />
                  )}
                  <div className="flex-1">
                    <Link href={`/blog/${featured.slug}`} className="text-3xl font-bold text-amber-800 hover:underline mb-2 block">{featured.title}</Link>
                    <div className="text-sm text-gray-500 mb-2">{new Date(featured.created_at).toLocaleDateString()} {featured.author_id && <span> | by {featured.author_id}</span>}</div>
                    <p className="text-gray-700 mb-4 line-clamp-4">{featured.summary || (featured.content ? featured.content.slice(0, 160) + "..." : "")}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(featured.tags || []).map((tag: string) => <span key={tag} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{tag}</span>)}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/blog/${featured.slug}`}>Read More</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.slice(1).map((post: any) => (
                <li key={post.id || post.slug} className="group bg-white rounded-xl shadow-md p-6 flex flex-col border border-amber-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                  {post.image_url && (
                    <Image src={post.image_url} alt={post.title} width={400} height={250} className="rounded mb-4 object-cover w-full h-48 group-hover:scale-105 transition-transform" />
                  )}
                  <Link href={`/blog/${post.slug}`} className="text-xl font-semibold text-amber-800 hover:underline mb-2" aria-label={post.title}>{post.title}</Link>
                  <div className="text-sm text-gray-500 mb-2">{new Date(post.created_at).toLocaleDateString()} {post.author_id && <span> | by {post.author_id}</span>}</div>
                  <p className="text-gray-700 line-clamp-3 mb-4">{post.summary || (post.content ? post.content.slice(0, 160) + "..." : "")}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(post.tags || []).map((tag: string) => <span key={tag} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{tag}</span>)}
                  </div>
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
          </>
        )}
      </main>
    </div>
  )
} 