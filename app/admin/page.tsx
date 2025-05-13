"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"

const TABS = [
  "Emergencies",
  "Volunteers",
  "Shelters",
  "Pet Reports",
  "Matches",
  "Users",
]

// Define types for admin dashboard data
interface Emergency {
  id: string
  pet_name?: string
  details?: string
  name?: string
  email?: string
  phone?: string
}
interface Volunteer {
  id: string
  name?: string
  message?: string
  email?: string
  phone?: string
  city?: string
  state?: string
}
interface Shelter {
  id: string
  name?: string
  description?: string
  email?: string
  phone?: string
  city?: string
  state?: string
  status?: string
}
interface PetReport {
  id: string
  pet_name?: string
  description?: string
  report_type?: string
  status?: string
  pet_type?: string
  breeds?: string[]
}
interface Match {
  id: string
  match_confidence: number
  lost_pet_id: string
  found_pet_id: string
  created_at: string
}
interface User {
  id: string
  name?: string
  email: string
}

export default function AdminPage() {
  const [tab, setTab] = useState("Emergencies")
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [petReports, setPetReports] = useState<PetReport[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const { data: emergencies } = await supabase.from("lost_pet_emergencies").select("*")
      const { data: volunteers } = await supabase.from("volunteers").select("*")
      const { data: shelters } = await supabase.from("shelters").select("*")
      const { data: petReports } = await supabase.from("pet_reports").select("*")
      const { data: matches } = await supabase.from("pet_match_history").select("*")
      const { data: users } = await supabase.from("users").select("*")
      setEmergencies(emergencies || [])
      setVolunteers(volunteers || [])
      setShelters(shelters || [])
      setPetReports(petReports || [])
      setMatches(matches || [])
      setUsers(users || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-700">Loading admin dashboard...</div>

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-amber-800 mb-6">Admin Dashboard</h1>
      <div className="flex gap-4 mb-8">
        {TABS.map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>
      {tab === "Emergencies" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Emergency Requests</h2>
          <ul className="space-y-3">
            {emergencies.map((e: Emergency) => (
              <li key={e.id} className="bg-red-50 rounded-lg p-4 flex flex-col gap-2 shadow">
                <div className="font-bold text-red-700">{e.pet_name || "Lost Pet"}</div>
                <div className="text-gray-700 text-sm">{e.details}</div>
                <div className="text-xs text-gray-500">{e.name} | {e.email} | {e.phone}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await supabase.from("lost_pet_emergencies").delete().eq("id", e.id)
                    setEmergencies(emergencies.filter((x: Emergency) => x.id !== e.id))
                  }}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tab === "Volunteers" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Volunteers</h2>
          <ul className="space-y-3">
            {volunteers.map((v: Volunteer) => (
              <li key={v.id} className="bg-green-50 rounded-lg p-4 flex flex-col gap-2 shadow">
                <div className="font-bold text-green-700">{v.name}</div>
                <div className="text-gray-700 text-sm">{v.message}</div>
                <div className="text-xs text-gray-500">{v.email} | {v.phone} | {v.city}, {v.state}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await supabase.from("volunteers").delete().eq("id", v.id)
                    setVolunteers(volunteers.filter((x: Volunteer) => x.id !== v.id))
                  }}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tab === "Shelters" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Shelter Signups</h2>
          <ul className="space-y-3">
            {shelters.map((s: Shelter) => (
              <li key={s.id} className="bg-yellow-50 rounded-lg p-4 flex flex-col gap-2 shadow">
                <div className="font-bold text-yellow-700">{s.name}</div>
                <div className="text-gray-700 text-sm">{s.description}</div>
                <div className="text-xs text-gray-500">{s.email} | {s.phone} | {s.city}, {s.state}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={async () => {
                    await supabase.from("shelters").update({ status: "active" }).eq("id", s.id)
                    setShelters(shelters.map((x: Shelter) => x.id === s.id ? { ...x, status: "active" } : x))
                  }}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await supabase.from("shelters").delete().eq("id", s.id)
                    setShelters(shelters.filter((x: Shelter) => x.id !== s.id))
                  }}>Reject</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tab === "Pet Reports" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Pet Reports</h2>
          <ul className="space-y-3">
            {petReports.map((p: PetReport) => (
              <li key={p.id} className="bg-amber-50 rounded-lg p-4 flex flex-col gap-2 shadow">
                <div className="font-bold text-amber-700">{p.pet_name || "Unnamed Pet"} ({p.report_type})</div>
                <div className="text-gray-700 text-sm">{p.description}</div>
                <div className="text-xs text-gray-500">{p.status} | {p.pet_type} | {p.breeds?.join(", ")}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => window.open(`/pet/${p.id}`, "_blank")}>View</Button>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await supabase.from("pet_reports").delete().eq("id", p.id)
                    setPetReports(petReports.filter((x: PetReport) => x.id !== p.id))
                  }}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tab === "Matches" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Pet Matches</h2>
          <ul className="space-y-3">
            {matches.map((m: Match) => (
              <li key={m.id} className="bg-purple-50 rounded-lg p-4 flex flex-col gap-2 shadow">
                <div className="font-bold text-purple-800">Match Confidence: {(m.match_confidence * 100).toFixed(0)}%</div>
                <div className="flex gap-4 text-sm">
                  <span>Lost Pet: <a href={`/pet/${m.lost_pet_id}`} className="text-amber-700 underline" target="_blank" rel="noopener">{m.lost_pet_id}</a></span>
                  <span>Found Pet: <a href={`/pet/${m.found_pet_id}`} className="text-amber-700 underline" target="_blank" rel="noopener">{m.found_pet_id}</a></span>
                </div>
                <div className="text-gray-600 text-xs">Matched on {new Date(m.created_at).toLocaleString()}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await supabase.from("pet_match_history").delete().eq("id", m.id)
                    setMatches(matches.filter((x: Match) => x.id !== m.id))
                  }}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {tab === "Users" && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <ul className="space-y-3">
            {users.map((u: User) => (
              <li key={u.id} className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow">
                <div className="font-bold text-blue-700">{u.name || u.email}</div>
                <div className="text-xs text-gray-500">{u.email}</div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${u.email}`)}>Email</Button>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await supabase.from("users").delete().eq("id", u.id)
                    setUsers(users.filter((x: User) => x.id !== u.id))
                  }}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
} 