"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, RefreshCw, Settings, Trophy, PawPrint, Home, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"

interface Shelter {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
}

interface Pet {
  id: string;
  name?: string;
  image_url?: string;
  pet_type?: string;
  breeds?: string[];
  description?: string;
  found_date?: string;
  status?: string;
}

function ShelterDashboard({ shelter }: { shelter: Shelter }) {
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("available")

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/shelters/pets?shelterId=${shelter.id}`)
        if (!response.ok) throw new Error("Failed to fetch pets")
        const data = await response.json()
        setPets(data)
      } catch (err) {
        setError("Failed to load shelter pets. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchPets()
  }, [shelter.id])

  async function markAsClaimed(petId: string) {
    setPets((prev) => prev.map((pet) => pet.id === petId ? { ...pet, status: "claimed" } : pet))
    try {
      const res = await fetch("/api/shelters/pets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId, status: "claimed" })
      })
      if (!res.ok) throw new Error("Failed to mark as claimed")
    } catch (err) {
      setError("Failed to mark pet as claimed. Please try again.")
      setPets((prev) => prev.map((pet) => pet.id === petId ? { ...pet, status: "available" } : pet))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-amber-800">Shelter Dashboard</h1>
          <p className="text-gray-600">Manage your found pets and shelter information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/shelter-dashboard/add-pet">
            <Button className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add New Pet
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue="available" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="available">Available Pets</TabsTrigger>
          <TabsTrigger value="claimed">Claimed Pets</TabsTrigger>
          <TabsTrigger value="adopted">Adopted Pets</TabsTrigger>
          <TabsTrigger value="settings">Shelter Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="w-full h-48 mb-4" />
                  <Skeleton className="w-1/2 h-6 mb-2" />
                  <Skeleton className="w-3/4 h-4 mb-2" />
                  <Skeleton className="w-1/3 h-4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <Button variant="link" className="mt-2" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : pets.filter((pet) => pet.status !== "claimed").length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg flex flex-col items-center">
              <PawPrint className="h-12 w-12 text-amber-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Pets</h3>
              <p className="text-gray-500 mb-4">You haven't added any pets that are currently available.</p>
              <Link href="/shelter-dashboard/add-pet">
                <Button className="bg-amber-600 hover:bg-amber-700">Add Your First Pet</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.filter((pet) => pet.status !== "claimed").map((pet) => (
                <Card key={pet.id}>
                  <CardHeader>
                    <CardTitle>{pet.name || "Unnamed Pet"}</CardTitle>
                    <CardContent>{pet.found_date ? `Found on ${new Date(pet.found_date).toLocaleDateString()}` : null}</CardContent>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-gray-200 rounded-md mb-4"></div>
                    <p className="text-sm text-gray-600">{pet.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => markAsClaimed(pet.id)}>Mark as Claimed</Button>
                    <Button variant="outline">Edit</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="claimed" className="mt-6">
          {pets.filter((pet) => pet.status === "claimed").length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg flex flex-col items-center">
              <Trophy className="h-12 w-12 text-yellow-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Claimed Pets</h3>
              <p className="text-gray-500">Pets that have been claimed by their owners will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.filter((pet) => pet.status === "claimed").map((pet) => (
                <Card key={pet.id}>
                  <CardHeader>
                    <CardTitle>
                      <span className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        <span className="font-bold text-yellow-800">{pet.name || "Unnamed Pet"}</span>
                        <span className="inline-block bg-yellow-300 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full ml-2">Claimed!</span>
                      </span>
                    </CardTitle>
                    <CardContent>{pet.found_date ? `Found on ${new Date(pet.found_date).toLocaleDateString()}` : null}</CardContent>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-gradient-to-r from-yellow-100 via-yellow-50 to-white border-2 border-yellow-300 rounded-md mb-4 animate-fade-in"></div>
                    <p className="text-sm text-gray-700">{pet.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" disabled>Claimed</Button>
                    <Button variant="outline">Edit</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="adopted" className="mt-6">
          <div className="text-center py-12 bg-gray-50 rounded-lg flex flex-col items-center">
            <Home className="h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Adopted Pets</h3>
            <p className="text-gray-500">Pets that have been adopted will appear here.</p>
          </div>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shelter Information</CardTitle>
              <CardContent>Update your shelter's details and preferences</CardContent>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Shelter Name</h4>
                  <p className="text-gray-600">{shelter.name}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Contact Information</h4>
                  <p className="text-gray-600">{shelter.address}</p>
                  <p className="text-gray-600">{shelter.phone}</p>
                  <p className="text-gray-600">{shelter.email}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">API Access</h4>
                  <p className="text-gray-600">Your API key: ••••••••••••••••</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Edit Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ShelterList({ shelters, showBecomeShelterCTA = false }: { shelters: Shelter[]; showBecomeShelterCTA?: boolean }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-amber-800 mb-8 text-center">Shelters</h1>
      {showBecomeShelterCTA && (
        <div className="flex justify-center mb-8">
          <Link href="/shelter-signup">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg text-lg shadow">
              Become a Shelter Partner
            </Button>
          </Link>
        </div>
      )}
      {shelters.length === 0 ? (
        <div className="text-center text-gray-500 flex flex-col items-center py-16 bg-gray-50 rounded-lg">
          <Search className="h-12 w-12 text-amber-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shelters Found</h3>
          <p className="mb-4">We couldn't find any shelters. Check back soon or become a shelter partner!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {shelters.map((shelter) => (
            <Link key={shelter.id} href={`/shelters/${shelter.id}`}>
              <Card className="hover:shadow-lg transition-shadow duration-200 h-full cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-amber-700 text-xl font-semibold">
                    {shelter.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-700 mb-2">
                    {shelter.city && shelter.state ? (
                      <span>{shelter.city}, {shelter.state}</span>
                    ) : (
                      <span>{shelter.address || "No address provided"}</span>
                    )}
                  </div>
                  {shelter.description && (
                    <div className="text-sm text-gray-500 line-clamp-2">{shelter.description}</div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SheltersPage() {
  const [user, setUser] = useState<any>(null)
  const [shelter, setShelter] = useState<Shelter | null>(null)
  const [userShelters, setUserShelters] = useState<Shelter[]>([])
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user && user.email) {
        // Fetch all shelters for this user (handle multiple)
        const res = await fetch(`/api/shelters/sync?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setUserShelters(data)
            setSelectedShelterId(data[0].id)
            setShelter(data[0])
            setLoading(false)
            return
          } else if (data && data.id) {
            setShelter(data)
            setLoading(false)
            return
          }
        }
      }
      // Otherwise, fetch all shelters
      try {
        const res = await fetch("/api/shelters/sync")
        if (!res.ok) throw new Error("Failed to fetch shelters")
        const data = await res.json()
        setShelters(Array.isArray(data) ? data : [])
      } catch (err) {
        setError("Could not load shelters.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // If user has multiple shelters, let them pick
  if (userShelters.length > 1) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-amber-800 mb-6">Select a Shelter Dashboard</h1>
        <div className="mb-8">
          <select
            className="border rounded px-4 py-2 text-lg"
            value={selectedShelterId || userShelters[0].id}
            onChange={e => {
              const id = e.target.value
              setSelectedShelterId(id)
              setShelter(userShelters.find(s => s.id === id) || null)
            }}
          >
            {userShelters.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {selectedShelterId && (
          <ShelterDashboard shelter={userShelters.find(s => s.id === selectedShelterId)!} />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="animate-spin h-8 w-8 text-amber-600" />
      </div>
    )
  }
  if (error) {
    return <div className="text-center text-red-600">{error}</div>
  }
  if (shelter) {
    return <ShelterDashboard shelter={shelter} />
  }
  // Show Become a Shelter CTA for non-shelter users
  return <ShelterList shelters={shelters} showBecomeShelterCTA={true} />
} 