"use client"
import { Suspense, useEffect } from "react"
import { UserPathSelector } from "@/components/user-path-selector"
import { Hero } from "@/components/hero"
import { HowItWorksContent } from "@/components/how-it-works-content"
import HomeClient from "@/components/home-client"
import { supabase } from "@/lib/supabase-client"

export default function Home() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        console.log("Supabase Auth user ID:", data.user.id)
      } else {
        console.log("No Supabase user signed in.")
      }
    })
  }, [])
  return <HomeClient />
}
