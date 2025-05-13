"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Users, HeartHandshake, CalendarCheck } from "lucide-react"
import Link from 'next/link'

const INTERESTS = [
  "Lost Pet Search Team",
  "Shelter Support",
  "Transport",
  "Foster Care",
  "Event Help",
  "Other"
]
const AVAILABILITY = [
  "Weekdays",
  "Weekends",
  "Evenings",
  "Flexible"
]

export default function VolunteerPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    interests: [INTERESTS[0]],
    availability: AVAILABILITY[0],
    skills: "",
    message: ""
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    if (name === "interests") {
      let newInterests = [...form.interests]
      if (checked) {
        newInterests.push(value)
      } else {
        newInterests = newInterests.filter((i) => i !== value)
      }
      setForm({ ...form, interests: newInterests })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to submit request")
      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="flex flex-col items-center mb-4">
        <HeartHandshake className="h-12 w-12 text-amber-600 mb-2" />
        <h1 className="text-3xl font-bold text-amber-800 mb-2">Thank You!</h1>
      </div>
      <p className="text-gray-700 mb-4">We appreciate your interest in volunteering. Our team will contact you soon.</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
        <b>Next Steps:</b>
        <ul className="list-disc ml-6 mt-2 text-sm text-amber-700">
          <li>Check your email for confirmation and onboarding info.</li>
          <li>Explore our <Link href="/community" className="text-amber-600 hover:text-amber-700 underline">Community Board</Link> to connect with others.</li>
          <li>Read <Link href="/blog/" className="text-amber-600 hover:text-amber-700">volunteer stories and tips</Link> on our blog.</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-amber-600" />
          <h1 className="text-4xl font-bold text-amber-800">Volunteer with POOCH</h1>
        </div>
        <p className="text-gray-700 mb-6">Join our mission to help lost pets and support local shelters. Volunteers are the heart of our community—choose how you want to help and make a real impact!</p>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
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
              <Label>Areas of Interest</Label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <label key={interest} className="flex items-center gap-1 text-sm bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    <input
                      type="checkbox"
                      name="interests"
                      value={interest}
                      checked={form.interests.includes(interest)}
                      onChange={handleChange}
                      className="accent-amber-600"
                    />
                    {interest}
                  </label>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">Select all that apply.</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <select id="availability" name="availability" value={form.availability} onChange={handleChange} className="w-full border border-amber-200 rounded-lg p-2 focus:ring-amber-400">
                {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="text-xs text-gray-500 mt-1">When are you usually available to help?</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Relevant Skills/Experience</Label>
              <Input id="skills" name="skills" value={form.skills} onChange={handleChange} placeholder="Animal care, transport, social media, etc." />
              <div className="text-xs text-gray-500 mt-1">Optional, but helps us match you to the right opportunities.</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" value={form.message} onChange={handleChange} rows={4} required placeholder="Tell us why you want to volunteer or any questions you have..." />
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
          <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>{loading ? "Submitting..." : "Join Volunteer Network"}</Button>
        </form>
      </div>
      <aside className="hidden md:block">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 shadow">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="h-6 w-6 text-amber-600" />
            <span className="font-bold text-amber-800">Why Volunteer?</span>
          </div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Make a real difference for lost pets and families</li>
            <li>Connect with a caring, local community</li>
            <li>Learn new skills and gain experience</li>
            <li>Flexible opportunities to fit your schedule</li>
          </ul>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-6 shadow">
          <div className="font-bold text-amber-800 mb-2">Volunteer Tips</div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Check the <Link href="/community" className="text-amber-600 hover:text-amber-700 underline">Community Board</Link> for new opportunities</li>
            <li>Read <Link href="/blog/" className="text-amber-600 hover:text-amber-700">volunteer stories</Link> for inspiration</li>
            <li>Reach out to local shelters and events</li>
            <li>Share your experience to help others</li>
          </ul>
        </div>
      </aside>
    </div>
  )
} 