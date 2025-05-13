"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Trash2, Mail, CheckCircle, XCircle, User, PawPrint, Home, Users as UsersIcon, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

const TABS = [
  { label: "Emergencies", icon: AlertTriangle },
  { label: "Volunteers", icon: UsersIcon },
  { label: "Shelters", icon: Home },
  { label: "Pet Reports", icon: PawPrint },
  { label: "Matches", icon: CheckCircle },
  { label: "Users", icon: User },
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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("Emergencies")
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [petReports, setPetReports] = useState<PetReport[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUser, setSearchUser] = useState("")
  const [searchPet, setSearchPet] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, action: null | (() => void), message: string }>({ open: false, action: null, message: "" })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (!user) {
        setChecking(false);
        router.replace("/login");
      } else {
        // Fetch the user's profile from the users table
        const { data: profile } = await supabase.from("users").select("is_admin").eq("auth_id", user.id).single();
        if (!profile?.is_admin) {
          setChecking(false);
          router.replace("/");
        } else {
          setChecking(false);
        }
      }
    });
  }, [router]);

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

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-amber-700">Checking access...</div>;
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-amber-700">
      <div className="space-y-4 w-full max-w-lg">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-amber-800 mb-6">Admin Dashboard</h1>
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur flex gap-4 mb-8 py-2 rounded-xl shadow-sm">
        {TABS.map((t) => (
          <Button
            key={t.label}
            variant={tab === t.label ? "default" : "outline"}
            onClick={() => setTab(t.label)}
            className="flex items-center gap-2"
            aria-label={t.label}
          >
            <t.icon className="h-5 w-5" />
            <span>{t.label}</span>
          </Button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tab === "Emergencies" && (
          <motion.section
            key="emergencies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-4">Emergency Requests</h2>
            <ul className="space-y-3">
              {emergencies.length === 0 ? (
                <div className="text-gray-400">No emergencies.</div>
              ) : emergencies.map((e: Emergency) => (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-red-50 rounded-lg p-4 flex flex-col gap-2 shadow"
                >
                  <div className="font-bold text-red-700">{e.pet_name || "Lost Pet"}</div>
                  <div className="text-gray-700 text-sm">{e.details}</div>
                  <div className="text-xs text-gray-500">{e.name} | {e.email} | {e.phone}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDialog({ open: true, action: async () => {
                      await supabase.from("lost_pet_emergencies").delete().eq("id", e.id)
                      setEmergencies(emergencies.filter((x: Emergency) => x.id !== e.id))
                      toast.success("Emergency deleted.")
                    }, message: "Delete this emergency request?" })}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}
        {tab === "Volunteers" && (
          <motion.section
            key="volunteers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-4">Volunteers</h2>
            <ul className="space-y-3">
              {volunteers.length === 0 ? (
                <div className="text-gray-400">No volunteers.</div>
              ) : volunteers.map((v: Volunteer) => (
                <motion.li
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-green-50 rounded-lg p-4 flex flex-col gap-2 shadow"
                >
                  <div className="font-bold text-green-700">{v.name}</div>
                  <div className="text-gray-700 text-sm">{v.message}</div>
                  <div className="text-xs text-gray-500">{v.email} | {v.phone} | {v.city}, {v.state}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDialog({ open: true, action: async () => {
                      await supabase.from("volunteers").delete().eq("id", v.id)
                      setVolunteers(volunteers.filter((x: Volunteer) => x.id !== v.id))
                      toast.success("Volunteer deleted.")
                    }, message: "Delete this volunteer?" })}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}
        {tab === "Shelters" && (
          <motion.section
            key="shelters"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-4">Shelter Signups</h2>
            <ul className="space-y-3">
              {shelters.length === 0 ? (
                <div className="text-gray-400">No shelters.</div>
              ) : shelters.map((s: Shelter) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-yellow-50 rounded-lg p-4 flex flex-col gap-2 shadow"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-yellow-200">
                      <AvatarFallback>{s.name?.[0] || "S"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-yellow-700">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </div>
                  </div>
                  <div className="text-gray-700 text-sm">{s.description}</div>
                  <div className="text-xs text-gray-500">{s.phone} | {s.city}, {s.state}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDialog({ open: true, action: async () => {
                      await supabase.from("shelters").update({ status: "active" }).eq("id", s.id)
                      setShelters(shelters.map((x: Shelter) => x.id === s.id ? { ...x, status: "active" } : x))
                      toast.success("Shelter approved.")
                    }, message: "Approve this shelter?" })}>
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDialog({ open: true, action: async () => {
                      await supabase.from("shelters").delete().eq("id", s.id)
                      setShelters(shelters.filter((x: Shelter) => x.id !== s.id))
                      toast.success("Shelter rejected.")
                    }, message: "Reject this shelter?" })}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className={s.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{s.status || "pending"}</Badge>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}
        {tab === "Pet Reports" && (
          <motion.section
            key="petreports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-4">Pet Reports</h2>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-amber-500" />
              <input
                type="text"
                placeholder="Search by pet name, type, or status..."
                value={searchPet}
                onChange={e => setSearchPet(e.target.value)}
                className="border border-amber-200 rounded px-3 py-1 w-full max-w-xs focus:ring-amber-400"
              />
            </div>
            <ul className="space-y-3">
              {petReports.filter(p => {
                const q = searchPet.toLowerCase()
                return (
                  !q ||
                  (p.pet_name?.toLowerCase().includes(q)) ||
                  (p.pet_type?.toLowerCase().includes(q)) ||
                  (p.status?.toLowerCase().includes(q))
                )
              }).length === 0 ? (
                <div className="text-gray-400">No pet reports found.</div>
              ) : petReports.filter(p => {
                const q = searchPet.toLowerCase()
                return (
                  !q ||
                  (p.pet_name?.toLowerCase().includes(q)) ||
                  (p.pet_type?.toLowerCase().includes(q)) ||
                  (p.status?.toLowerCase().includes(q))
                )
              }).map((p: PetReport) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-amber-50 rounded-lg p-4 flex flex-col gap-2 shadow"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-amber-200">
                      <AvatarFallback>{p.pet_name?.[0] || "P"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-amber-700">{p.pet_name || "Unnamed Pet"} <Badge className="ml-2 bg-amber-100 text-amber-700">{p.report_type}</Badge></div>
                      <div className="text-xs text-gray-500">{p.pet_type} | {p.status}</div>
                    </div>
                  </div>
                  <div className="text-gray-700 text-sm">{p.description}</div>
                  <div className="text-xs text-gray-500">{p.breeds?.join(", ")}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(`/pet/${p.id}`, "_blank")}>View</Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDialog({ open: true, action: async () => {
                      await supabase.from("pet_reports").delete().eq("id", p.id)
                      setPetReports(petReports.filter((x: PetReport) => x.id !== p.id))
                      toast.success("Pet report deleted.")
                    }, message: "Delete this pet report?" })}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}
        {tab === "Matches" && (
          <motion.section
            key="matches"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-4">Pet Matches</h2>
            <ul className="space-y-3">
              {matches.length === 0 ? (
                <div className="text-gray-400">No matches.</div>
              ) : matches.map((m: Match) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-purple-50 rounded-lg p-4 flex flex-col gap-2 shadow"
                >
                  <div className="font-bold text-purple-800">Match Confidence: {(m.match_confidence * 100).toFixed(0)}%</div>
                  <div className="flex gap-4 text-sm">
                    <span>Lost Pet: <a href={`/pet/${m.lost_pet_id}`} className="text-amber-700 underline" target="_blank" rel="noopener">{m.lost_pet_id}</a></span>
                    <span>Found Pet: <a href={`/pet/${m.found_pet_id}`} className="text-amber-700 underline" target="_blank" rel="noopener">{m.found_pet_id}</a></span>
                  </div>
                  <div className="text-gray-600 text-xs">Matched on {new Date(m.created_at).toLocaleString()}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDialog({ open: true, action: async () => {
                      await supabase.from("pet_match_history").delete().eq("id", m.id)
                      setMatches(matches.filter((x: Match) => x.id !== m.id))
                      toast.success("Match deleted.")
                    }, message: "Delete this match?" })}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}
        {tab === "Users" && (
          <motion.section
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-2xl font-semibold mb-4">Users</h2>
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                className="border border-blue-200 rounded px-3 py-1 w-full max-w-xs focus:ring-blue-400"
              />
            </div>
            <ul className="space-y-3">
              {users.filter(u => {
                const q = searchUser.toLowerCase()
                return (
                  !q ||
                  (u.name?.toLowerCase().includes(q)) ||
                  (u.email?.toLowerCase().includes(q))
                )
              }).length === 0 ? (
                <div className="text-gray-400">No users found.</div>
              ) : users.filter(u => {
                const q = searchUser.toLowerCase()
                return (
                  !q ||
                  (u.name?.toLowerCase().includes(q)) ||
                  (u.email?.toLowerCase().includes(q))
                )
              }).map((u: User) => (
                <motion.li
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-blue-200">
                      <AvatarFallback>{u.name?.[0] || u.email?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-blue-700">{u.name || u.email}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(`mailto:${u.email}`)}>
                      <Mail className="h-4 w-4 mr-1" /> Email
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setConfirmDialog({ open: true, action: async () => {
                      await supabase.from("users").delete().eq("id", u.id)
                      setUsers(users.filter((x: User) => x.id !== u.id))
                      toast.success("User deleted.")
                    }, message: "Delete this user?" })}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}
      </AnimatePresence>
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog(c => ({ ...c, open }))}>
        <DialogContent>
          <DialogTitle>Are you sure?</DialogTitle>
          <div className="py-4">{confirmDialog.message}</div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: null, message: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (confirmDialog.action) await confirmDialog.action()
              setConfirmDialog({ open: false, action: null, message: "" })
            }}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 