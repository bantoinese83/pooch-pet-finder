"use client"
import React, { useRef } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trophy, PawPrint, Users, Bell, AlertTriangle, Heart, Sparkles } from "lucide-react"
import Link from "next/link"
import { AvatarHeader } from "@/components/ui/avatar-header"
import { StatsCard } from "@/components/ui/stats-card"
import { motion, AnimatePresence } from "framer-motion"
import { Confetti } from "@/components/magicui/confetti"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
dayjs.extend(relativeTime)

// Define types for pet reports, emergencies, volunteers, shelters, notifications, match history
interface PetReport {
  id: string
  status: string
  created_at: string
  pet_type: string
  description: string
  location: string
  image_url: string
  pet_name?: string
}

interface UserData {
  id: string
  email: string
  created_at: string
  name?: string
  avatar_url?: string
}

interface Emergency {
  id: string
  pet_name?: string
  details?: string
  created_at?: string
}

interface Volunteer {
  id: string
  name?: string
  message?: string
  created_at?: string
}

interface ShelterRequest {
  id: string
  name?: string
  description?: string
}

interface Notification {
  id: string
  message: string
  read?: boolean
  created_at?: string
}

interface MatchHistory {
  id: string
  match_confidence: number
  lost_pet_id: string
  found_pet_id: string
  created_at: string
  lost_pet?: PetReport
  found_pet?: PetReport
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [profile, setProfile] = useState<UserData | null>(null)
  const [userReports, setUserReports] = useState<PetReport[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const confettiRef = useRef<{ fire: () => void } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: unknown } }) => {
      if (!user) {
        setLoading(false)
        setUser(null)
        return
      }
      setUser(user as UserData)
      // Fetch profile info
      const { data: profile } = await supabase.from("users").select("*").eq("auth_id", (user as UserData).id).single()
      setProfile(profile as UserData)
      // Fetch pet reports
      const { data: petReports } = await supabase.from("pet_reports").select("*").eq("user_id", profile?.id)
      setUserReports(petReports || [])
      // Fetch emergencies
      const { data: emergencies } = await supabase.from("lost_pet_emergencies").select("*").eq("user_id", profile?.id)
      setEmergencies(emergencies || [])
      // Fetch volunteer requests
      const { data: volunteers } = await supabase.from("volunteers").select("*").eq("user_id", profile?.id)
      setVolunteers(volunteers || [])
      // Fetch notifications
      const { data: notifications } = await supabase.from("notifications").select("*").eq("user_id", profile?.id).order("created_at", { ascending: false })
      setNotifications(notifications || [])
      setLoading(false)
    })
  }, [])

  // Helper to mark a pet report as claimed
  async function markAsClaimed(petId: string) {
    setUserReports((prev: PetReport[]) => prev.map((pet: PetReport) => pet.id === petId ? { ...pet, status: "claimed" } : pet))
    try {
      const res = await fetch("/api/pet-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId, status: "claimed" })
      })
      if (!res.ok) throw new Error("Failed to mark as claimed")
      // Fire confetti!
      confettiRef.current?.fire()
    } catch {
      // Revert optimistic update
      setUserReports((prev: PetReport[]) => prev.map((pet: PetReport) => pet.id === petId ? { ...pet, status: "active" } : pet))
    }
  }

  // Aggregate recent activity
  const recentActivity: Array<{
    type: string
    description: string
    icon: React.ReactNode
    timestamp: string
  }> = []

  userReports.forEach((pet) => {
    recentActivity.push({
      type: pet.status === "claimed" ? "claimed" : "pet_report",
      description: pet.status === "claimed"
        ? `Claimed pet: ${pet.pet_name || "Unnamed Pet"}`
        : `Reported pet: ${pet.pet_name || "Unnamed Pet"}`,
      icon: pet.status === "claimed"
        ? <Trophy className="h-5 w-5 text-yellow-500" />
        : <PawPrint className="h-5 w-5 text-amber-600" />,
      timestamp: pet.created_at,
    })
  })
  emergencies.forEach((e) => {
    recentActivity.push({
      type: "emergency",
      description: `Emergency: ${e.pet_name || "Lost Pet"}`,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      timestamp: e.created_at || "",
    })
  })
  volunteers.forEach((v) => {
    recentActivity.push({
      type: "volunteer",
      description: `Volunteer: ${v.name || "New Volunteer"}`,
      icon: <Users className="h-5 w-5 text-green-600" />,
      timestamp: v.created_at || "",
    })
  })
  notifications.forEach((n) => {
    recentActivity.push({
      type: "notification",
      description: n.message,
      icon: <Bell className="h-5 w-5 text-amber-500" />,
      timestamp: n.created_at || "",
    })
  })
  // Sort by timestamp descending
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const topRecent = recentActivity.slice(0, 8)

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-700">Loading dashboard...</div>
  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 via-amber-50 to-white">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-amber-800 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">Please <Link href="/login" className="text-amber-700 underline">sign in</Link> to access your dashboard.</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Confetti overlay */}
      <Confetti ref={confettiRef} className="fixed inset-0 pointer-events-none z-50" manualstart />
      {/* Dashboard Header Card */}
      <div className="relative bg-gradient-to-br from-amber-50 via-white to-yellow-50 rounded-2xl shadow-lg p-6 mb-10 border border-amber-100">
        <AvatarHeader
          name={profile?.name || user?.email}
          email={user?.email}
          avatarUrl={profile?.avatar_url}
        >
          <div className="flex gap-6 mt-4">
            <StatsCard
              icon={<PawPrint className="h-7 w-7 text-amber-600 mb-1" />}
              value={userReports.length}
              label="Pets Reported"
              colorClass="text-amber-700"
            />
            <StatsCard
              icon={<Trophy className="h-7 w-7 text-yellow-500 mb-1" />}
              value={userReports.filter((p) => p.status === "claimed").length}
              label="Pets Claimed"
              colorClass="text-yellow-700"
            />
            <StatsCard
              icon={<Users className="h-7 w-7 text-green-600 mb-1" />}
              value={volunteers.length}
              label="Volunteer"
              colorClass="text-green-700"
            />
          </div>
        </AvatarHeader>
      </div>
      {/* Tabs for reports */}
      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Reports</TabsTrigger>
          <TabsTrigger value="claimed">Claimed Pets</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {/* List active (not claimed) pet reports */}
          <AnimatePresence>
            {userReports.filter((pet: PetReport) => pet.status !== "claimed").map((pet: PetReport) => (
              <motion.div
                key={pet.id}
                className="mb-4 p-4 bg-white rounded-xl shadow border border-amber-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="font-bold text-lg flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-amber-600" />
                  {pet.pet_name || "Unnamed Pet"}
                </div>
                <div className="text-sm text-gray-600">{pet.description}</div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-3 py-1 border rounded text-amber-700 border-amber-300 hover:bg-amber-50"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to mark this pet as claimed? This action cannot be undone.")) {
                        markAsClaimed(pet.id)
                      }
                    }}
                  >
                    Mark as Claimed
                  </button>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/edit-report/${pet.id}`)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await supabase.from("pet_reports").delete().eq("id", pet.id)
                    setUserReports(userReports.filter((p: PetReport) => p.id !== pet.id))
                  }}>Delete</Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </TabsContent>
        <TabsContent value="claimed">
          {/* List claimed pet reports */}
          <AnimatePresence>
            {userReports.filter((pet: PetReport) => pet.status === "claimed").length === 0 ? (
              <motion.div className="text-center py-8 text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                No claimed pets yet.
              </motion.div>
            ) : (
              userReports.filter((pet: PetReport) => pet.status === "claimed").map((pet: PetReport) => (
                <motion.div
                  key={pet.id}
                  className="mb-4 p-4 bg-gradient-to-r from-yellow-100 via-yellow-50 to-white border-2 border-yellow-300 rounded-xl shadow flex items-center gap-4 animate-fade-in"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex-shrink-0">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-yellow-800">{pet.pet_name || "Unnamed Pet"}</span>
                      <span className="inline-block bg-yellow-300 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full ml-2">Claimed!</span>
                    </div>
                    <div className="text-sm text-gray-700">{pet.description}</div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 mt-10">
        <div className="bg-white rounded-xl shadow border border-amber-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-amber-700">Notifications</h2>
          </div>
          {notifications.length === 0 ? <div className="text-gray-500">No notifications.</div> : (
            <ul className="space-y-3">
              {notifications.map((n: Notification) => (
                <li key={n.id} className={`rounded-lg p-3 shadow ${n.read ? 'bg-gray-100' : 'bg-amber-100'}`}>{n.message}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl shadow border border-red-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-red-700">Emergency Requests</h2>
          </div>
          {emergencies.length === 0 ? <div className="text-gray-500">No emergency requests.</div> : (
            <ul className="space-y-3">
              {emergencies.map((e: Emergency) => (
                <li key={e.id} className="bg-red-50 rounded-lg p-4 flex flex-col gap-2 shadow">
                  <div className="font-bold text-red-700">{e.pet_name || "Lost Pet"}</div>
                  <div className="text-gray-700 text-sm">{e.details}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/edit-emergency/${e.id}`)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      await supabase.from("lost_pet_emergencies").delete().eq("id", e.id)
                      setEmergencies(emergencies.filter((x: Emergency) => x.id !== e.id))
                    }}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-xl shadow border border-green-100 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold text-green-700">Volunteer Requests</h2>
          </div>
          {volunteers.length === 0 ? <div className="text-gray-500">No volunteer requests.</div> : (
            <ul className="space-y-3">
              {volunteers.map((v: Volunteer) => (
                <li key={v.id} className="bg-green-50 rounded-lg p-4 flex flex-col gap-2 shadow">
                  <div className="font-bold text-green-700">{v.name}</div>
                  <div className="text-gray-700 text-sm">{v.message}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/edit-volunteer/${v.id}`)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      await supabase.from("volunteers").delete().eq("id", v.id)
                      setVolunteers(volunteers.filter((x: Volunteer) => x.id !== v.id))
                    }}>Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Recent Activity (Dynamic) */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-yellow-50 rounded-xl shadow border border-amber-100 p-6 mt-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-amber-700">Recent Activity</h2>
        </div>
        {topRecent.length === 0 ? (
          <div className="text-gray-500">No recent activity yet.</div>
        ) : (
          <ul className="divide-y divide-amber-100">
            {topRecent.map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span>{a.icon}</span>
                <span className="flex-1 text-gray-800">{a.description}</span>
                <span className="text-xs text-gray-500 min-w-[80px] text-right">{a.timestamp ? dayjs(a.timestamp).fromNow() : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}