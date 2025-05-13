"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, Camera, X, Calendar } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/multi-select"
import { LocationMap } from "@/components/location-map"
import { petTypes, petColors, petSizes, petAges, petGenders, petFeatures, getBreedsByPetType } from "@/lib/pet-data"
import { MAX_UPLOAD_SIZE, SUPPORTED_IMAGE_TYPES } from "@/lib/constants"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import Image from "next/image"

export function UploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [petType, setPetType] = useState<string>("")
  const [breeds, setBreeds] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [size, setSize] = useState<string>("")
  const [age, setAge] = useState<string>("")
  const [gender, setGender] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [description, setDescription] = useState<string>("")
  const [distinctiveFeatures, setDistinctiveFeatures] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [availableBreeds, setAvailableBreeds] = useState<{ value: string; label: string }[]>([])
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [dayFound, setDayFound] = useState<string>(new Date().toISOString().split("T")[0]) // Default to today
  // Add a ref for the camera input
  const cameraInputRef = React.useRef<HTMLInputElement>(null)

  // Update available breeds when pet type changes
  useEffect(() => {
    if (petType) {
      const breeds = getBreedsByPetType(petType)
      setAvailableBreeds(breeds)
      // Clear selected breeds when pet type changes
      setBreeds([])
    } else {
      setAvailableBreeds([])
    }
  }, [petType])

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return "Please upload a JPEG or PNG image"
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return `File size must be less than ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`
    }

    return null
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validationError = validateFile(selectedFile)

      if (validationError) {
        setError(validationError)
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
  }, [])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const validationError = validateFile(droppedFile)

      if (validationError) {
        setError(validationError)
        return
      }

      setFile(droppedFile)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === "string") {
          setPreview(result)
        }
      }
      reader.readAsDataURL(droppedFile)
    }
  }, [])

  const handleLocationSelect = useCallback((locationData: { address: string; lat: number; lng: number }) => {
    setLocation(locationData.address)
    setCoordinates({ lat: locationData.lat, lng: locationData.lng })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Please upload an image of your pet")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("image", file)
      formData.append("petType", petType)

      // Add arrays as JSON strings
      formData.append("breeds", JSON.stringify(breeds))
      formData.append("colors", JSON.stringify(colors))
      formData.append("distinctiveFeatures", JSON.stringify(distinctiveFeatures))

      // Add other fields
      formData.append("size", size)
      formData.append("age", age)
      formData.append("gender", gender)
      formData.append("location", location)
      formData.append("dayFound", dayFound) // Add the day found field

      // Add coordinates if available
      if (coordinates) {
        formData.append("coordinates", JSON.stringify(coordinates))
      }

      formData.append("description", description)

      // Upload to API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()

      // Redirect to results page
      router.push(`/results/${data.searchId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      id="upload-form"
    >
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
        <div className="space-y-2">
          <Label htmlFor="pet-image" className="text-amber-800 font-medium">
            Upload Pet Photo
          </Label>
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
              dragActive ? "border-amber-500 bg-amber-50" : "border-amber-300 hover:bg-amber-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="pet-image"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            {/* Camera input for direct capture */}
            <input
              id="camera-capture"
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="pet-image" className="cursor-pointer block">
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div
                    className="flex flex-col items-center"
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative group">
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt="Pet preview"
                        width={200}
                        height={200}
                        className="rounded-lg mb-2 max-h-[200px] w-auto object-contain"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            setFile(null)
                            setPreview(null)
                          }}
                          className="bg-white p-2 rounded-full"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <span className="text-sm text-amber-600 flex items-center gap-1">
                      <Upload className="h-4 w-4" /> Change image
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex flex-col items-center py-4"
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Upload className="h-12 w-12 text-amber-400 mb-2" />
                    <p className="text-amber-800 font-medium">Click to upload or drag and drop</p>
                    <p className="text-gray-500 text-sm">JPEG or PNG (max 10MB)</p>
                    <div className="mt-4 flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-300"
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById("pet-image")?.click()
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Browse Files
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-300"
                        onClick={(e) => {
                          e.preventDefault()
                          cameraInputRef.current?.click()
                        }}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pet-type" className="text-amber-800 font-medium">
              Pet Type
            </Label>
            <Select value={petType} onValueChange={setPetType}>
              <SelectTrigger id="pet-type" className="border-amber-200 focus:ring-amber-500">
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
            <Label htmlFor="breeds" className="text-amber-800 font-medium">
              Breed(s)
            </Label>
            <MultiSelect
              options={availableBreeds}
              selected={breeds}
              onChange={setBreeds}
              placeholder="Select breed(s)"
              emptyMessage={petType ? "No breeds found." : "Select a pet type first."}
              className="border-amber-200 focus-within:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="colors" className="text-amber-800 font-medium">
              Color(s)
            </Label>
            <MultiSelect
              options={petColors}
              selected={colors}
              onChange={setColors}
              placeholder="Select color(s)"
              className="border-amber-200 focus-within:ring-amber-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="day-found" className="text-amber-800 font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Day Found
            </Label>
            <Input
              id="day-found"
              type="date"
              value={dayFound}
              onChange={(e) => setDayFound(e.target.value)}
              max={new Date().toISOString().split("T")[0]} // Can't select future dates
              className="border-amber-200 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-amber-800 font-medium">
            Last Seen Location
          </Label>
          <LocationMap onLocationSelect={handleLocationSelect} initialAddress={location} />
        </div>

        <motion.button
          type="button"
          variants={{
            initial: { opacity: 0.8 },
            hover: { opacity: 1, scale: 1.02 },
          }}
          initial="initial"
          whileHover="hover"
          className="text-amber-600 font-medium flex items-center gap-1 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md px-2 py-1"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          {showAdvancedOptions ? "Hide advanced options" : "Show advanced options"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${showAdvancedOptions ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </motion.button>

        <AnimatePresence>
          {showAdvancedOptions && (
            <motion.div
              className="space-y-6 border-t border-gray-200 pt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size" className="text-amber-800 font-medium">
                    Size
                  </Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger id="size" className="border-amber-200 focus:ring-amber-500">
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
                  <Label htmlFor="age" className="text-amber-800 font-medium">
                    Age
                  </Label>
                  <Select value={age} onValueChange={setAge}>
                    <SelectTrigger id="age" className="border-amber-200 focus:ring-amber-500">
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
                  <Label htmlFor="gender" className="text-amber-800 font-medium">
                    Gender
                  </Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender" className="border-amber-200 focus:ring-amber-500">
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
                <Label htmlFor="distinctive-features" className="text-amber-800 font-medium">
                  Distinctive Features
                </Label>
                <MultiSelect
                  options={petFeatures}
                  selected={distinctiveFeatures}
                  onChange={setDistinctiveFeatures}
                  placeholder="Select distinctive features"
                  className="border-amber-200 focus-within:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-amber-800 font-medium">
                  Additional Details
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any other distinguishing features, behavior, medical conditions, etc."
                  rows={3}
                  className="border-amber-200 focus:ring-amber-500"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Find My Pet"
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  )
}
