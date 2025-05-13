"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPin, AlertTriangle, PawPrint } from "lucide-react"
import Link from "next/link"

const PET_TYPES = ["Dog", "Cat", "Other"]
const URGENCY_LEVELS = ["Immediate", "Within 24 hours", "This Week"]
const CONTACT_METHODS = ["Email", "Phone", "Both"]

export default function EmergencyPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    petName: "",
    petType: PET_TYPES[0],
    lastSeen: "",
    urgency: URGENCY_LEVELS[0],
    contactMethod: CONTACT_METHODS[2],
    details: ""
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to submit request")
      setSuccess(true)
    } catch (err) {
      setError("Submission failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="flex flex-col items-center mb-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
        <h1 className="text-3xl font-bold text-amber-800 mb-2">Request Received</h1>
      </div>
      <p className="text-gray-700 mb-4">Our team will contact you as soon as possible for urgent support.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
        <b>What to do next:</b>
        <ul className="list-disc ml-6 mt-2 text-sm text-amber-700">
          <li>Check our <Link href="/map" className="underline">Lost &amp; Found Map</Link> for recent sightings.</li>
          <li>Share your report on the <Link href="/community" className="underline">Community Board</Link>.</li>
          <li>Read <Link href="/blog" className="underline">expert tips</Link> for finding lost pets.</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h1 className="text-4xl font-bold text-amber-800">Lost Pet Emergency</h1>
        </div>
        <p className="text-gray-700 mb-6">Need urgent help? Submit this form for priority support from our team and community. We'll reach out as soon as possible and boost your report across our network.</p>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="petName">Pet Name</Label>
              <Input id="petName" name="petName" value={form.petName} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="petType">Pet Type</Label>
              <select id="petType" name="petType" value={form.petType} onChange={handleChange} className="w-full border border-amber-200 rounded-lg p-2 focus:ring-amber-400">
                {PET_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <select id="urgency" name="urgency" value={form.urgency} onChange={handleChange} className="w-full border border-amber-200 rounded-lg p-2 focus:ring-amber-400">
                {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastSeen">Last Seen Location</Label>
            <Input id="lastSeen" name="lastSeen" value={form.lastSeen} onChange={handleChange} placeholder="Address, intersection, or area" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactMethod">Preferred Contact Method</Label>
            <select id="contactMethod" name="contactMethod" value={form.contactMethod} onChange={handleChange} className="w-full border border-amber-200 rounded-lg p-2 focus:ring-amber-400">
              {CONTACT_METHODS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Details / Message</Label>
            <Textarea id="details" name="details" value={form.details} onChange={handleChange} rows={4} required placeholder="Describe your pet, last seen time, and any urgent info..." />
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>{loading ? "Submitting..." : "Request Priority Support"}</Button>
        </form>
      </div>
      <aside className="hidden md:block">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 shadow">
          <div className="flex items-center gap-2 mb-2">
            <PawPrint className="h-6 w-6 text-amber-600" />
            <span className="font-bold text-amber-800">What to Do While You Wait</span>
          </div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Check the <Link href="/map" className="underline">Lost &amp; Found Map</Link> for recent sightings.</li>
            <li>Post on the <Link href="/community" className="underline">Community Board</Link> for local help.</li>
            <li>Read <Link href="/blog" className="underline">tips from experts</Link> to maximize your search.</li>
            <li>Contact nearby shelters and vets.</li>
          </ul>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-6 shadow">
          <div className="font-bold text-amber-800 mb-2">Why Use POOCH Emergency?</div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Priority support from our team and network</li>
            <li>Faster notifications to local volunteers</li>
            <li>Increased visibility on our map and community</li>
            <li>Expert advice and resources</li>
          </ul>
        </div>
      </aside>
    </div>
  )
} 