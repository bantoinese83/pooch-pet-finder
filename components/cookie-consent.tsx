"use client"
import { useEffect, useState } from "react"

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent")
    if (!consent) setVisible(true)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 w-full bg-amber-900 text-white px-4 py-3 flex flex-col md:flex-row items-center justify-between z-50 shadow-lg">
      <span className="mb-2 md:mb-0">We use cookies to enhance your experience and for analytics. By using this site, you agree to our <a href="/privacy" className="underline">Privacy Policy</a>.</span>
      <button
        onClick={acceptCookies}
        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded shadow"
        aria-label="Accept cookies"
      >
        Accept
      </button>
    </div>
  )
} 