"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { PawPrintIcon as Paw, Search, CheckCircle, Trophy } from "lucide-react"
import { motion } from "framer-motion"
import { SITE_NAME } from "@/lib/constants"
import { supabase } from "@/lib/supabase-client"

function usePetStats() {
  const [stats, setStats] = useState({ lost: 0, found: 0, total: 0, claimed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function fetchStats() {
      setLoading(true)
      // Count lost
      const { count: lost } = await supabase.from("pet_reports").select("id", { count: "exact", head: true }).eq("report_type", "lost")
      // Count found
      const { count: found } = await supabase.from("pet_reports").select("id", { count: "exact", head: true }).eq("report_type", "found")
      // Count total
      const { count: total } = await supabase.from("pet_reports").select("id", { count: "exact", head: true })
      // Count claimed
      const { count: claimed } = await supabase.from("pet_reports").select("id", { count: "exact", head: true }).eq("status", "claimed")
      if (mounted) setStats({ lost: lost || 0, found: found || 0, total: total || 0, claimed: claimed || 0 })
      setLoading(false)
    }
    fetchStats()
    return () => { mounted = false }
  }, [])
  return { ...stats, loading }
}

function AnimatedCount({ value, duration = 1.2, className = "" }: { value: number, duration?: number, className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = 0
    let raf: number
    const startTime = performance.now()
    function animate(now: number) {
      const elapsed = (now - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.floor(progress * value))
      if (progress < 1) raf = requestAnimationFrame(animate)
      else setDisplay(value)
    }
    animate(performance.now())
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <span className={className}>{display.toLocaleString()}</span>
}

export function Hero() {
  const pawsRef = useRef<HTMLDivElement>(null)
  const { lost, found, total, claimed, loading } = usePetStats()

  // Create floating paw prints animation
  useEffect(() => {
    if (!pawsRef.current) return

    const createPaw = () => {
      const paw = document.createElement("div")
      paw.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="#D97706" opacity="0.3" />
      </svg>`
      paw.className = "absolute"
      paw.style.left = `${Math.random() * 100}%`
      paw.style.top = "0"
      paw.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random() * 1.5})`
      paw.style.opacity = "0"
      paw.style.transition = "all 15s linear"

      pawsRef.current?.appendChild(paw)

      // Start animation
      setTimeout(() => {
        paw.style.top = "100%"
        paw.style.opacity = "0.3"
      }, 100)

      // Remove after animation completes
      setTimeout(() => {
        paw.remove()
      }, 15000)
    }

    // Create paws at random intervals
    const interval = setInterval(createPaw, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-amber-100 via-amber-50 to-white py-16 md:py-24 lg:py-32 flex items-center min-h-[60vh]">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <svg width="100%" height="100%" className="w-full h-full opacity-10" style={{position: 'absolute', top: 0, left: 0}} preserveAspectRatio="none">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="#fbbf24" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      {/* Floating Paws Animation */}
      <div ref={pawsRef} className="absolute inset-0 pointer-events-none z-10" aria-hidden="true" />

      <div className="container mx-auto px-4 relative z-20">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-20">
          {/* Text Content */}
          <motion.div
            className="w-full max-w-2xl text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
              <Paw className="h-10 w-10 text-amber-600 animate-bounce" />
              <h1 className="text-5xl font-extrabold text-amber-800 drop-shadow-lg tracking-tight">{SITE_NAME}</h1>
            </div>
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-amber-900 mb-6 drop-shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Find Lost & Found Pets Fast
            </motion.h2>
            <motion.p
              className="text-xl md:text-2xl text-amber-800 mb-10 max-w-xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Upload a photo of your lost pet and we'll search shelter databases to find potential matches using <span className="font-semibold text-amber-700">advanced image recognition technology</span>.
            </motion.p>
            {/* Animated Stats */}
            <motion.div
              className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-10 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center gap-3 bg-white/80 border border-amber-200 rounded-xl px-5 py-3 shadow hover:scale-105 transition-transform">
                <Search className="h-8 w-8 text-amber-600" />
                <div>
                  <div className="text-2xl font-bold text-amber-800">
                    {loading ? <span className="animate-pulse">...</span> : <AnimatedCount value={lost} />}
                  </div>
                  <div className="text-xs text-amber-700 font-medium uppercase tracking-wide">Pets Reported Lost</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/80 border border-green-200 rounded-xl px-5 py-3 shadow hover:scale-105 transition-transform">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-800">
                    {loading ? <span className="animate-pulse">...</span> : <AnimatedCount value={found} />}
                  </div>
                  <div className="text-xs text-green-700 font-medium uppercase tracking-wide">Pets Reported Found</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/80 border border-yellow-300 rounded-xl px-5 py-3 shadow hover:scale-105 transition-transform">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {loading ? <span className="animate-pulse">...</span> : <AnimatedCount value={claimed} />}
                  </div>
                  <div className="text-xs text-yellow-700 font-medium uppercase tracking-wide">Pets Claimed</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/80 border border-purple-200 rounded-xl px-5 py-3 shadow hover:scale-105 transition-transform">
                <Paw className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-800">
                    {loading ? <span className="animate-pulse">...</span> : <AnimatedCount value={total} />}
                  </div>
                  <div className="text-xs text-purple-700 font-medium uppercase tracking-wide">Total Pets in System</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Image Content */}
          <motion.div
            className="w-full flex justify-center lg:justify-end lg:w-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
          >
            <div className="relative group">
              <div className="absolute -inset-6 bg-amber-200 rounded-full opacity-60 blur-2xl animate-pulse z-0" />
              <Image
                src="/cartoon-dog-and-cat.png"
                alt="Lost pet finder"
                width={420}
                height={420}
                className="relative rounded-full shadow-2xl border-8 border-white group-hover:scale-105 transition-transform duration-300 z-10"
                priority
              />
              {/* Decorative paw print */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-full p-2 shadow-md border border-amber-200 z-20 animate-bounce">
                <Paw className="h-8 w-8 text-amber-500" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-20" />
    </section>
  )
}
