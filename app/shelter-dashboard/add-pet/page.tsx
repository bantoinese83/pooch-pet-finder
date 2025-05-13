"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/multi-select"
import { LocationMap } from "@/components/location-map"
import { petTypes, petColors, petSizes, petAges, petGenders, petFeatures, getBreedsByPetType } from "@/lib/pet-data"
import { Upload, Loader2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { generatePetDescriptionFromImage } from "@/lib/gemini"

export default function AddPet() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [petType, setPetType] = useState<string>("")
  const [breeds, setBreeds] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [size, setSize] = useState<string>("")
  const [age, setAge] = useState<string>("")
  const [gender, setGender] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [foundLocation, setFoundLocation] = useState<string>("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [description, setDescription] = useState<string>("")
  const [distinctiveFeatures, setDistinctiveFeatures] = useState<string[]>([])
  const [foundDate, setFoundDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [availableBreeds, setAvailableBreeds] = useState<{ value: string; label: string }[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Mock shelter ID - in a real app, this would come from authentication
  const shelterId = "mock-shelter-id"
  const authToken = "mock-auth-token"

  // Update available breeds when pet type changes
  const handlePetTypeChange = (value: string) => {
    setPetType(value)
    const breeds = getBreedsByPetType(value)
    setAvailableBreeds(breeds)
    setBreeds([])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.includes("image/")) {
        setError("Please upload an image file (JPEG or PNG)")
        return
      }

      setFile(selectedFile)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === "string") {
          setPreview(result)
        }
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleLocationSelect = (locationData: { address: string; lat: number; lng: number }) => {
    setFoundLocation(locationData.address)
    setCoordinates({ lat: locationData.lat, lng: locationData.lng })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please upload an image of the pet")
      return
    }

    if (!petType) {
      setError("Please select a pet type")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("image", file)
      formData.append("shelterId", shelterId)
      formData.append("authToken", authToken)
      formData.append("petType", petType)

      // Add arrays as JSON strings
      formData.append("breeds", JSON.stringify(breeds))
      formData.append("colors", JSON.stringify(colors))
      formData.append("distinctiveFeatures", JSON.stringify(distinctiveFeatures))

      // Add other fields
      formData.append("size", size)
      formData.append("age", age)
      formData.append("gender", gender)
      formData.append("name", name)
      formData.append("foundLocation", foundLocation)
      formData.append("foundDate", foundDate)

      // Add coordinates if available
      if (coordinates) {
        formData.append("coordinates", JSON.stringify(coordinates))
      }

      formData.append("description", description)

      // Upload to API
      const response = await fetch("/api/shelters/pets", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to add pet")
      }

      const data = await response.json()

      // Redirect to shelter dashboard
      router.push("/shelter-dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/shelter-dashboard" className="inline-flex items-center text-amber-800 hover:text-amber-600">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-800">Add Found Pet</h1>
        <p className="text-gray-600">Enter details about the pet you've found</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto">
        <div className="space-y-2">
          <Label htmlFor="pet-image">Upload Pet Photo</Label>
          <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 text-center hover:bg-amber-50 transition-colors cursor-pointer">
            <input
              id="pet-image"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="pet-image" className="cursor-pointer block">
              {preview ? (
                <div className="flex flex-col items-center">
                  <Image
                    src={preview || "/placeholder.svg"}
                    alt="Pet preview"
                    width={200}
                    height={200}
                    className="rounded-lg mb-2 max-h-[200px] w-auto object-contain"
                  />
                  <span className="text-sm text-amber-600 flex items-center gap-1">
                    <Upload className="h-4 w-4" /> Change image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <Upload className="h-12 w-12 text-amber-400 mb-2" />
                  <p className="text-amber-800 font-medium">Click to upload or drag and drop</p>
                  <p className="text-gray-500 text-sm">JPEG or PNG (max 10MB)</p>
                </div>
              )}
            </label>
          </div>
          {file && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-amber-600 border-amber-300"
              disabled={aiLoading}
              onClick={async () => {
                setAiLoading(true)
                setAiError(null)
                try {
                  const reader = new FileReader()
                  reader.onload = async (e) => {
                    const base64 = (e.target?.result as string)?.split(",")[1]
                    if (base64) {
                      const aiText = await generatePetDescriptionFromImage(base64)
                      // Split tags if present
                      const [desc, tags] = aiText.split("Tags:")
                      setDescription(desc.trim())
                      // Optionally, parse and set tags to features/colors/breeds
                    }
                  }
                  reader.readAsDataURL(file)
                } catch (err) {
                  setAiError("AI description failed. Please try again.")
                } finally {
                  setAiLoading(false)
                }
              }}
            >
              {aiLoading ? "Generating..." : "Let AI describe this pet for you!"}
            </Button>
          )}
          {aiError && <div className="text-red-600 text-sm mt-1">{aiError}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pet Name (if known)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter pet name if known"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="found-date">Date Found</Label>
            <Input id="found-date" type="date" value={foundDate} onChange={(e) => setFoundDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pet-type">Pet Type</Label>
            <Select value={petType} onValueChange={handlePetTypeChange}>
              <SelectTrigger id="pet-type">
                <SelectValue placeholder="Select pet type" />
              </SelectTrigger>
              <SelectContent>
                {petTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breeds">Breed(s)</Label>
            <MultiSelect
              options={availableBreeds}
              selected={breeds}
              onChange={setBreeds}
              placeholder="Select breed(s)"
              emptyMessage={petType ? "No breeds found." : "Select a pet type first."}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger id="size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {petSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age (Estimated)</Label>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger id="age">
                <SelectValue placeholder="Select age" />
              </SelectTrigger>
              <SelectContent>
                {petAges.map((age) => (
                  <SelectItem key={age.value} value={age.value}>
                    {age.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {petGenders.map((gender) => (
                  <SelectItem key={gender.value} value={gender.value}>
                    {gender.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="colors">Color(s)</Label>
          <MultiSelect options={petColors} selected={colors} onChange={setColors} placeholder="Select color(s)" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="distinctive-features">Distinctive Features</Label>
          <MultiSelect
            options={petFeatures}
            selected={distinctiveFeatures}
            onChange={setDistinctiveFeatures}
            placeholder="Select distinctive features"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location Where Found</Label>
          <LocationMap onLocationSelect={handleLocationSelect} initialAddress={foundLocation} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Additional Details</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any other details about the pet, condition when found, behavior, etc."
            rows={3}
          />
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/shelter-dashboard")}>
            Cancel
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add Pet"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
