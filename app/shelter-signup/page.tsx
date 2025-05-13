"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { HeartHandshake, Handshake, Info } from "lucide-react"
import Link from "next/link"

const SHELTER_TYPES = [
  "Animal Shelter",
  "Rescue Group",
  "Foster Network",
  "Sanctuary",
  "Other"
]
const SERVICES = [
  "Adoption",
  "Foster",
  "Medical Care",
  "Lost & Found",
  "Community Events",
  "Other"
]

export default function ShelterSignupPage() {
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    website: "",
    shelterType: SHELTER_TYPES[0],
    capacity: "",
    services: [SERVICES[0]],
    description: ""
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    if (name === "services") {
      let newServices = [...form.services]
      if (checked) {
        newServices.push(value)
      } else {
        newServices = newServices.filter((s) => s !== value)
      }
      setForm({ ...form, services: newServices })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/shelter-signup", {
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
        <Handshake className="h-12 w-12 text-amber-700 mb-2" />
        <h1 className="text-3xl font-bold text-amber-800 mb-2">Thank You!</h1>
      </div>
      <p className="text-gray-700 mb-4">Your shelter registration has been received. Our team will review and contact you soon.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
        <b>Next Steps:</b>
        <ul className="list-disc ml-6 mt-2 text-sm text-amber-700">
          <li>Watch for a confirmation email and onboarding info.</li>
          <li>Explore your <Link href="/shelter-dashboard" className="underline">Shelter Dashboard</Link> to manage pets and requests.</li>
          <li>Read <Link href="/blog" className="underline">partner success stories</Link> on our blog.</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <HeartHandshake className="h-8 w-8 text-amber-700" />
          <h1 className="text-4xl font-bold text-amber-800">Shelter Partnership Registration</h1>
        </div>
        <p className="text-gray-700 mb-6">Partner with POOCH to help more pets find homes, reunite families, and access powerful tools for your shelter. Join our network and amplify your impact!</p>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shelter Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelterType">Shelter Type</Label>
              <select id="shelterType" name="shelterType" value={form.shelterType} onChange={handleChange} className="w-full border border-amber-200 rounded-lg p-2 focus:ring-amber-400">
                {SHELTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-1">Select the type that best describes your organization.</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" name="contactName" value={form.contactName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" value={form.website} onChange={handleChange} placeholder="https://" />
              <div className="text-xs text-gray-500 mt-1">Optional, but helps us verify your organization.</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={form.city} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" value={form.state} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip</Label>
              <Input id="zip" name="zip" value={form.zip} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Approximate Pet Capacity</Label>
              <Input id="capacity" name="capacity" value={form.capacity} onChange={handleChange} placeholder="e.g. 50" />
              <div className="text-xs text-gray-500 mt-1">Optional, but helps us understand your needs.</div>
            </div>
            <div className="space-y-2">
              <Label>Services Provided</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((service) => (
                  <label key={service} className="flex items-center gap-1 text-sm bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    <input
                      type="checkbox"
                      name="services"
                      value={service}
                      checked={form.services.includes(service)}
                      onChange={handleChange}
                      className="accent-amber-700"
                    />
                    {service}
                  </label>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">Select all that apply.</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Tell us about your shelter, mission, and how we can help..." />
            <div className="text-xs text-gray-500 mt-1">Share your mission, special programs, or needs.</div>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
          <Button type="submit" className="w-full bg-amber-700 hover:bg-amber-800" disabled={loading}>{loading ? "Submitting..." : "Register Shelter"}</Button>
        </form>
      </div>
      <aside className="hidden md:block">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-6 w-6 text-amber-700" />
            <span className="font-bold text-amber-800">Why Partner with POOCH?</span>
          </div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Boost pet visibility and adoptions</li>
            <li>Access lost/found pet tools and alerts</li>
            <li>Connect with volunteers and fosters</li>
            <li>Share events and resources with the community</li>
            <li>Dedicated dashboard for easy management</li>
          </ul>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-6 shadow">
          <div className="font-bold text-amber-800 mb-2">Partnership Tips</div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Keep your pet list and info up to date</li>
            <li>Engage with the <Link href="/community" className="underline">Community Board</Link></li>
            <li>Share your shelter&apos;s story on our <Link href="/blog" className="underline">blog</Link></li>
            <li>Reach out for support or collaboration ideas</li>
          </ul>
        </div>
      </aside>
    </div>
  )
} 