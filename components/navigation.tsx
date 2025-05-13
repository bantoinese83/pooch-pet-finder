"use client"


import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Menu, X, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SITE_NAME } from "@/lib/constants"
import { supabase } from "@/lib/supabase-client"
import type { User } from "@supabase/auth-js"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = "/" // redirect to home
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Shelters", href: "/shelter-dashboard" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
  ]

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-amber-600">
                {SITE_NAME}
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.href ? "text-white bg-amber-600" : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label={item.name}
              >
                {item.name}
              </Link>
            ))}
            {loading ? null : user ? (
              <div className="relative ml-4">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-amber-800 hover:bg-amber-50 border border-amber-200"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="User menu"
                >
                  <UserCircle className="h-6 w-6 text-amber-700" />
                  <span>{user.email ?? "User"}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-amber-50" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-amber-50" onClick={() => setMenuOpen(false)}>Profile</Link>
                    <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-amber-50" onClick={handleSignOut}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="ml-2 border-amber-400 text-amber-800 hover:bg-amber-50">
                  Sign In / Create Account
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href ? "text-white bg-amber-600" : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label={item.name}
              >
                {item.name}
              </Link>
            ))}
            {loading ? null : user ? (
              <div className="mt-2 border-t border-gray-200 pt-2">
                <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-amber-50" onClick={closeMenu}>Dashboard</Link>
                <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-amber-50" onClick={closeMenu}>Profile</Link>
                <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-amber-50" onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" className="w-full mt-2 border-amber-400 text-amber-800 hover:bg-amber-50">
                  Sign In / Create Account
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  )
}
