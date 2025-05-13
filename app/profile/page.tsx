"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { AvatarHeader } from "@/components/ui/avatar-header"
import { StatsCard } from "@/components/ui/stats-card"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { Button } from "@/components/ui/button"
import { PawPrint, Trophy, Users, Mail, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import Image from "next/image"
import React from "react"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [petReports, setPetReports] = useState<any[]>([])
  const [claimedCount, setClaimedCount] = useState(0)
  const [volunteer, setVolunteer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ name: "", bio: "", avatar_url: "" })
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const cameraInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        setUser(null)
        return
      }
      setUser(user)
      // Fetch profile info
      const { data: profile } = await supabase.from("users").select("*").eq("auth_id", user.id).single()
      setProfile(profile)
      setForm({
        name: profile?.name || "",
        bio: profile?.bio || "",
        avatar_url: profile?.avatar_url || ""
      })
      setAvatarPreview(profile?.avatar_url || "")
      // Fetch pet reports
      const { data: petReports } = await supabase.from("pet_reports").select("*").eq("user_id", profile?.id)
      setPetReports(petReports || [])
      // Claimed pets
      setClaimedCount((petReports || []).filter((p: any) => p.status === "claimed").length)
      // Volunteer status
      const { data: volunteers } = await supabase.from("volunteers").select("*").eq("user_id", profile?.id)
      setVolunteer((volunteers && volunteers.length > 0) ? volunteers[0] : null)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-700">Loading profile...</div>
  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 via-amber-50 to-white">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-amber-800 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">Please <a href="/login" className="text-amber-700 underline">sign in</a> to view your profile.</p>
      </div>
    </div>
  )

  const handleEditClick = () => setEditMode(true)
  const handleCancel = () => {
    setEditMode(false)
    setForm({
      name: profile?.name || "",
      bio: profile?.bio || "",
      avatar_url: profile?.avatar_url || ""
    })
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setAvatarPreview(ev.target.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }
  const handleAvatarRemove = () => {
    setAvatarFile(null)
    setAvatarPreview("")
    setForm(f => ({ ...f, avatar_url: "" }))
  }
  const handleSave = async () => {
    setSaving(true)
    let avatarUrl = form.avatar_url
    if (avatarFile) {
      const formData = new FormData()
      formData.append("image", avatarFile)
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (response.ok) {
        const data = await response.json()
        avatarUrl = data.url || avatarUrl
      } else {
        toast.error("Failed to upload avatar image.")
        setSaving(false)
        return
      }
    }
    const { error } = await supabase.from("users").update({
      name: form.name,
      bio: form.bio,
      avatar_url: avatarUrl
    }).eq("id", profile.id)
    setSaving(false)
    if (error) {
      toast.error("Failed to update profile.")
      return
    }
    setProfile({ ...profile, ...form, avatar_url: avatarUrl })
    setEditMode(false)
    setAvatarFile(null)
    toast.success("Profile updated!")
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8">
        <AvatarHeader
          name={profile?.name || user.email}
          email={user.email}
          avatarUrl={editMode ? (avatarPreview || "/placeholder-user.jpg") : profile?.avatar_url || "/placeholder-user.jpg"}
        >
          {editMode && avatarPreview && (
            <button
              type="button"
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
              onClick={handleAvatarRemove}
              title="Remove avatar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </AvatarHeader>
        {editMode && (
          <div className="flex flex-col items-center gap-2 mb-2">
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <input
              id="avatar-camera"
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-300"
                onClick={() => document.getElementById("avatar-upload")?.click()}
                disabled={saving}
              >
                Upload Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-300"
                onClick={() => cameraInputRef.current?.click()}
                disabled={saving}
              >
                Take Photo
              </Button>
            </div>
            {avatarFile && (
              <span className="text-xs text-gray-500">{avatarFile.name}</span>
            )}
          </div>
        )}
        {editMode ? (
          <div className="w-full max-w-sm flex flex-col gap-3 items-center">
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="text-center text-2xl font-bold text-amber-800"
              disabled={saving}
            />
          </div>
        ) : (
          <Button size="icon" variant="outline" className="ml-2" onClick={handleEditClick}>
            <Edit className="h-5 w-5 text-amber-600" />
          </Button>
        )}
        {volunteer && !editMode && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-semibold mb-2">
            <Users className="h-4 w-4" />
            Volunteer
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatsCard
          icon={<PawPrint className="h-8 w-8 text-amber-600 mb-2" />}
          value={petReports.length}
          label="Pets Reported"
          colorClass="text-amber-700"
        />
        <StatsCard
          icon={<Trophy className="h-8 w-8 text-yellow-500 mb-2" />}
          value={claimedCount}
          label="Pets Claimed"
          colorClass="text-yellow-700"
        />
        <StatsCard
          icon={<Users className="h-8 w-8 text-green-600 mb-2" />}
          value={volunteer ? 1 : 0}
          label="Volunteer"
          colorClass="text-green-700"
        />
      </div>
      <div className="bg-white border border-amber-100 rounded-xl p-6 shadow text-center">
        <h2 className="text-xl font-semibold text-amber-800 mb-2">About You</h2>
        {editMode ? (
          <>
            <Textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about yourself!"
              className="mb-2"
              rows={3}
              disabled={saving}
            />
            <div className="flex gap-2 justify-center mt-2">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} loading={saving} disabled={saving} className="bg-amber-600 text-white hover:bg-amber-700">Save</Button>
            </div>
          </>
        ) : (
          <p className="text-gray-700 mb-2">{profile?.bio || "You haven't added a bio yet. Tell us a bit about yourself!"}</p>
        )}
      </div>
    </main>
  )
} 