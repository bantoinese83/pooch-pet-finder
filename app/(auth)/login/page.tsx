"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push("/dashboard")
    })
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-amber-50 to-white">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-amber-800 mb-4 text-center">Welcome to POOCH 🐾</h1>
        <p className="text-gray-600 mb-6 text-center">Sign in to manage your pets, requests, and more!</p>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          magicLink
          theme="light"
          localization={{
            variables: {
              sign_in: { email_label: "Email address", password_label: "Password" },
              sign_up: { email_label: "Email address", password_label: "Password" },
            },
          }}
        />
      </div>
    </div>
  )
} 