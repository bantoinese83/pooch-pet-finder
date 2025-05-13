"use client"
import { Suspense } from "react"
import Image from "next/image"
import { UserPathSelector } from "@/components/user-path-selector"
import { Hero } from "@/components/hero"
import { HowItWorksContent } from "@/components/how-it-works-content"
import { clientEnv } from "@/lib/env"
import { motion } from "framer-motion"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

const testimonials = [
  {
    name: "Sarah & Max",
    text: "POOCH helped us find our dog Max within 48 hours! The AI match was spot on and the community support was amazing.",
    image: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=facearea&w=400&h=400&facepad=2"
  },
  {
    name: "Carlos R.",
    text: "I found a lost cat and posted on POOCH. The owner reached out the same day. This platform really works!",
    image: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=facearea&w=400&h=400&facepad=2"
  },
  {
    name: "The Barking Lot Shelter",
    text: "Partnering with POOCH has helped us reunite dozens of pets with their families. The dashboard and AI tools are fantastic.",
    image: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=facearea&w=400&h=400&facepad=2"
  }
]

export default function HomeClient() {
  // Check if we have the required environment variables
  const hasRequiredEnv = !!clientEnv.SUPABASE_URL && !!clientEnv.SUPABASE_ANON_KEY && !!clientEnv.MAPS_API_KEY
  const [fabOpen, setFabOpen] = useState(false)
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [loadingBlogs, setLoadingBlogs] = useState(true)

  useEffect(() => {
    async function fetchBlogs() {
      setLoadingBlogs(true)
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3)
      setBlogPosts(data || [])
      setLoadingBlogs(false)
    }
    fetchBlogs()
  }, [])

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between">
        <Hero />

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <Suspense fallback={<div>Loading user options...</div>}>
              <UserPathSelector />
            </Suspense>
          </div>
        </section>

        <HowItWorksContent />

        {/* Testimonials Carousel */}
        <section className="w-full bg-white py-16">
          <div className="container mx-auto px-4">
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold text-center text-amber-800 mb-10">Success Stories</motion.h2>
            <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
              {testimonials.map((t, i) => (
                <motion.div key={i} className="bg-amber-50 border border-amber-200 rounded-xl shadow-md p-8 max-w-sm flex flex-col items-center text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.2, duration: 0.5 }}>
                  <Image src={t.image} alt={t.name} width={80} height={80} className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white shadow" />
                  <p className="text-lg text-amber-900 mb-4">“{t.text}”</p>
                  <span className="font-semibold text-amber-700">{t.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Highlights */}
        <section className="w-full bg-gradient-to-br from-amber-50 via-white to-amber-100 py-16">
          <div className="container mx-auto px-4">
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold text-center text-amber-800 mb-10">From Our Blog</motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              {loadingBlogs ? (
                <div className="text-amber-700">Loading blog posts...</div>
              ) : blogPosts.length === 0 ? (
                <div className="text-gray-500">No blog posts yet.</div>
              ) : (
                blogPosts.map((post, i) => (
                  <motion.div key={post.id || post.slug} className="bg-white border border-amber-100 rounded-xl shadow-md p-6 flex flex-col" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.2, duration: 0.5 }}>
                    {post.image_url && (
                      <Image src={post.image_url} alt={post.title} width={400} height={250} className="rounded mb-4 object-cover w-full h-48" />
                    )}
                    <h3 className="text-xl font-semibold text-amber-800 mb-2">{post.title}</h3>
                    <p className="text-gray-700 mb-4">{post.summary || (post.content ? post.content.slice(0, 160) + "..." : "")}</p>
                    <Link href={`/blog/${post.slug}`} className="text-amber-600 font-medium hover:underline mt-auto">Read More →</Link>
                  </motion.div>
                ))
              )}
            </div>
            <div className="flex justify-center mt-8">
              <Link href="/blog" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition">View All Blog Posts</Link>
            </div>
          </div>
        </section>

        {/* Animated Call-to-Action Section */}
        <section className="w-full py-20 bg-gradient-to-r from-amber-200 via-amber-100 to-white relative overflow-hidden">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="container mx-auto px-4 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-amber-900 mb-6 text-center drop-shadow">Ready to Help or Need Help?</h2>
            <p className="text-lg text-amber-800 mb-10 text-center max-w-2xl">Whether you&apos;ve lost a pet, found one, want to volunteer, or need urgent help, POOCH is here for you. Take action now and join our caring community!</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/emergency" className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-3 rounded-lg shadow transition">Lost Pet Emergency</Link>
              <Link href="/lost" className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 rounded-lg shadow transition">Report Lost Pet</Link>
              <Link href="/found" className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg shadow transition">Report Found Pet</Link>
              <Link href="/volunteer" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg shadow transition">Volunteer</Link>
            </div>
          </motion.div>
          {/* Decorative animated paw prints */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <svg width="100%" height="100%" className="w-full h-full opacity-10" style={{position: 'absolute', top: 0, left: 0}} preserveAspectRatio="none">
              <defs>
                <pattern id="pawdots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="8" fill="#fbbf24" />
                  <circle cx="40" cy="20" r="6" fill="#fbbf24" />
                  <circle cx="30" cy="50" r="5" fill="#fbbf24" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pawdots)" />
            </svg>
          </div>
        </section>

        {!hasRequiredEnv && (
          <div className="w-full bg-amber-50 p-4 text-center">
            <p className="text-amber-800">
              Warning: Some environment variables are missing. The application may not function correctly.
            </p>
          </div>
        )}
      </main>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          aria-label="Report Lost or Found Pet"
          className="bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-amber-300 transition"
          onClick={() => setFabOpen((v) => !v)}
        >
          <Plus className={`h-8 w-8 transition-transform ${fabOpen ? 'rotate-45' : ''}`} />
        </button>
        {fabOpen && (
          <div className="absolute bottom-20 right-0 flex flex-col gap-2 animate-fade-in">
            <Link href="/lost" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span role="img" aria-label="Lost">🔎</span> Report Lost Pet
            </Link>
            <Link href="/found" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span role="img" aria-label="Found">🐾</span> Report Found Pet
            </Link>
          </div>
        )}
      </div>
    </>
  )
} 