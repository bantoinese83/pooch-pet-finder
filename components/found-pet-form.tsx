"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, Camera, X, Calendar, MapPin, Info, Sparkles, HelpCircle } from "lucide-react"
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
import { generatePetDescriptionFromImage } from "@/lib/gemini"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase-client"
import Link from "next/link"

const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
const Webcam = dynamic(() => import("react-webcam"), { ssr: false })

export function FoundPetForm() {
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
  const [finderName, setFinderName] = useState<string>("")
  const [finderPhone, setFinderPhone] = useState<string>("")
  const [finderEmail, setFinderEmail] = useState<string>("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  // Camera input ref for direct capture
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const webcamRef = React.useRef(null)
  const [user, setUser] = useState<unknown | null>(null)

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

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
      setError("Please upload an image of the pet you found")
      return
    }

    if (!finderEmail && !finderPhone) {
      setError("Please provide at least one contact method (email or phone)")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("image", file)
      formData.append("petType", petType)
      formData.append("reportType", "found") // Indicate this is a found pet report

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

      // Add finder contact information
      formData.append("finderName", finderName)
      formData.append("finderPhone", finderPhone)
      formData.append("finderEmail", finderEmail)

      // Add coordinates if available
      if (coordinates) {
        formData.append("coordinates", JSON.stringify(coordinates))
      }

      formData.append("description", description)

      // Upload to API
      const response = await fetch("/api/found-pet", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()

      // Redirect to confirmation page
      router.push(`/confirmation/${data.reportId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      // @ts-expect-error
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "photo.jpg", { type: "image/jpeg" })
            setFile(file)
            setPreview(imageSrc)
            setShowCameraModal(false)
          })
      }
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Main Form Section */}
      <div className="md:col-span-2">
        {/* Hero Section */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-8 w-8 text-amber-600 animate-pulse" />
          <h1 className="text-4xl font-bold text-amber-800">Report a Found Pet</h1>
        </div>
        <p className="text-gray-700 mb-6">Found a lost pet? Fill out the form below to help reunite them with their family. Our AI and community will help spread the word and match with lost reports!</p>
        {!user && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-4 mb-6 flex items-center gap-4">
            <Info className="h-6 w-6 text-amber-700" />
            <div>
              <b>Please sign in or create an account to report a found pet.</b>
              <div className="mt-2">
                <Link href="/login">
                  <Button variant="outline" className="border-amber-400 text-amber-800 hover:bg-amber-100">Sign In / Create Account</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md" aria-label="Found Pet Report Form">
          {/* Photo Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="pet-image" className="text-amber-800 font-medium">
              Upload Pet Photo <span className="text-red-500">*</span>
            </Label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${dragActive ? "border-amber-500 bg-amber-50" : "border-amber-300 hover:bg-amber-50"}`}
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
                aria-required="true"
              />
              {/* Camera input for direct capture (mobile only) */}
              {isMobile && (
                <input
                  id="camera-capture"
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              )}
              <label htmlFor="pet-image" className="cursor-pointer block">
                <AnimatePresence mode="wait">
                  {preview ? (
                    <motion.div className="flex flex-col items-center" key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                      <div className="relative group">
                        <Image src={preview || "/placeholder.svg"} alt="Pet preview" width={200} height={200} className="rounded-lg mb-2 max-h-[200px] w-auto object-contain" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button type="button" onClick={e => { e.preventDefault(); setFile(null); setPreview(null); }} className="bg-white p-2 rounded-full" aria-label="Remove image">
                            <X className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <span className="text-sm text-amber-600 flex items-center gap-1"><Upload className="h-4 w-4" /> Change image</span>
                    </motion.div>
                  ) : (
                    <motion.div className="flex flex-col items-center py-4" key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <Upload className="h-12 w-12 text-amber-400 mb-2" />
                      <p className="text-amber-800 font-medium">Click to upload or drag and drop</p>
                      <p className="text-gray-500 text-sm">JPEG or PNG (max 10MB)</p>
                      <div className="mt-4 flex gap-2 justify-center">
                        <Button type="button" variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={e => { e.preventDefault(); document.getElementById("pet-image")?.click(); }}>
                          <Upload className="h-4 w-4 mr-2" /> Browse Files
                        </Button>
                        {isMobile && (
                          <Button type="button" variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={e => { e.preventDefault(); cameraInputRef.current?.click(); }}>
                            <Camera className="h-4 w-4 mr-2" /> Take Photo
                          </Button>
                        )}
                        <Button type="button" variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={e => { e.preventDefault(); setShowCameraModal(true); }}>
                          <Camera className="h-4 w-4 mr-2" /> Use Camera
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            </div>
            {/* Camera Modal for custom camera UI */}
            {showCameraModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full flex flex-col items-center">
                  <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-lg mb-4 w-full h-64 object-cover" videoConstraints={{ facingMode: "environment" }} />
                  <div className="flex gap-2 w-full">
                    <Button type="button" className="flex-1 bg-amber-600 text-white" onClick={handleCapture}><Camera className="h-4 w-4 mr-1" /> Capture</Button>
                    <Button type="button" className="flex-1" variant="outline" onClick={() => setShowCameraModal(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
                  </div>
                </div>
              </div>
            )}
            {file && (
              <div className="flex items-center gap-2 mt-2">
                <Button type="button" variant="outline" size="sm" className="text-amber-600 border-amber-300" disabled={aiLoading} onClick={async () => { setAiLoading(true); setAiError(null); try { const reader = new FileReader(); reader.onload = async (e) => { const base64 = (e.target?.result as string)?.split(",")[1]; if (base64) { const aiText = await generatePetDescriptionFromImage(base64); const [desc, tags] = aiText.split("Tags:"); setDescription(desc.trim()); } }; reader.readAsDataURL(file); } catch (err) { setAiError("AI description failed. Please try again."); } finally { setAiLoading(false); } }}>
                  {aiLoading ? "Generating..." : <><Sparkles className="h-4 w-4 mr-1" /> Let AI describe the pet</>}
                </Button>
                <HelpCircle className="h-4 w-4 text-gray-400" title="AI will analyze your photo and suggest a detailed description." />
              </div>
            )}
            {aiError && <div className="text-red-600 text-sm mt-1">{aiError}</div>}
          </div>

          {/* Pet Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pet-type" className="text-amber-800 font-medium">Pet Type <span className="text-red-500">*</span></Label>
              <Select value={petType} onValueChange={setPetType} required>
                <SelectTrigger id="pet-type" className="border-amber-200 focus:ring-amber-500"><SelectValue placeholder="Select pet type" /></SelectTrigger>
                <SelectContent>{petTypes.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent>
              </Select>
              <div className="text-xs text-gray-500">Choose the closest match for the pet.</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="colors" className="text-amber-800 font-medium">Color(s) <span className="text-red-500">*</span></Label>
              <MultiSelect options={petColors} selected={colors} onChange={setColors} placeholder="Select color(s)" className="border-amber-200 focus-within:ring-amber-500" />
              <div className="text-xs text-gray-500">Select all that apply.</div>
            </div>
          </div>

          {/* Dynamic Fields: Breeds, Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {petType && (
              <div className="space-y-2">
                <Label htmlFor="breeds" className="text-amber-800 font-medium">Breed(s)</Label>
                <MultiSelect options={availableBreeds} selected={breeds} onChange={setBreeds} placeholder="Select breed(s)" emptyMessage={petType ? "No breeds found." : "Select a pet type first."} className="border-amber-200 focus-within:ring-amber-500" />
                <div className="text-xs text-gray-500">Select all that apply. Leave blank if unsure.</div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="distinctive-features" className="text-amber-800 font-medium">Distinctive Features</Label>
              <MultiSelect options={petFeatures} selected={distinctiveFeatures} onChange={setDistinctiveFeatures} placeholder="Select distinctive features" className="border-amber-200 focus-within:ring-amber-500" />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <motion.button type="button" variants={{ initial: { opacity: 0.8 }, hover: { opacity: 1, scale: 1.02 } }} initial="initial" whileHover="hover" className="text-amber-600 font-medium flex items-center gap-1 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md px-2 py-1" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} aria-expanded={showAdvancedOptions} aria-controls="advanced-options">
            {showAdvancedOptions ? "Hide advanced options" : "Show advanced options"}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${showAdvancedOptions ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </motion.button>
          <AnimatePresence>{showAdvancedOptions && (<motion.div id="advanced-options" className="space-y-6 border-t border-gray-200 pt-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size" className="text-amber-800 font-medium">Size</Label>
                <Select value={size} onValueChange={setSize}><SelectTrigger id="size" className="border-amber-200 focus:ring-amber-500"><SelectValue placeholder="Select size" /></SelectTrigger><SelectContent>{petSizes.map(size => (<SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>))}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age" className="text-amber-800 font-medium">Age</Label>
                <Select value={age} onValueChange={setAge}><SelectTrigger id="age" className="border-amber-200 focus:ring-amber-500"><SelectValue placeholder="Select age" /></SelectTrigger><SelectContent>{petAges.map(age => (<SelectItem key={age.value} value={age.value}>{age.label}</SelectItem>))}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-amber-800 font-medium">Gender</Label>
                <Select value={gender} onValueChange={setGender}><SelectTrigger id="gender" className="border-amber-200 focus:ring-amber-500"><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent>{petGenders.map(gender => (<SelectItem key={gender.value} value={gender.value}>{gender.label}</SelectItem>))}</SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-amber-800 font-medium">Additional Details</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any other distinguishing features, behavior, medical conditions, etc." rows={3} className="border-amber-200 focus:ring-amber-500" />
            </div>
          </motion.div>)}</AnimatePresence>

          {/* Found Date & Location Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day-found" className="text-amber-800 font-medium flex items-center gap-1"><Calendar className="h-4 w-4" /> Day Found <span className="text-red-500">*</span></Label>
              <Input id="day-found" type="date" value={dayFound} onChange={e => setDayFound(e.target.value)} max={new Date().toISOString().split("T")[0]} className="border-amber-200 focus:ring-amber-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-amber-800 font-medium flex items-center gap-1"><MapPin className="h-4 w-4" /> Found Location <span className="text-red-500">*</span></Label>
              <div className="flex gap-2 items-center">
                <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Address, intersection, or area" className="border-amber-200 focus:ring-amber-500 flex-1" required aria-required="true" />
                <Button type="button" variant="ghost" size="icon" aria-label="Use my current location" onClick={() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(pos => { setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocation(`Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`); }); } }}><MapPin className="h-5 w-5" /></Button>
              </div>
              <div className="text-xs text-gray-500">Provide as much detail as possible. You can use your current location or pick on the map below.</div>
              <div className="mt-2">
                <LocationMap
                  coordinates={coordinates}
                  onLocationSelect={handleLocationSelect}
                  height={250}
                  markerDraggable
                />
              </div>
            </div>
          </div>

          {/* Finder Contact Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="finder-name" className="text-amber-800 font-medium">Your Name</Label>
              <Input id="finder-name" value={finderName} onChange={e => setFinderName(e.target.value)} placeholder="Enter your name (optional)" className="border-amber-200 focus:ring-amber-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finder-phone" className="text-amber-800 font-medium">Phone</Label>
              <Input id="finder-phone" value={finderPhone} onChange={e => setFinderPhone(e.target.value)} placeholder="Phone number" className="border-amber-200 focus:ring-amber-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finder-email" className="text-amber-800 font-medium">Email</Label>
              <Input id="finder-email" value={finderEmail} onChange={e => setFinderEmail(e.target.value)} placeholder="Email address" className="border-amber-200 focus:ring-amber-500" />
              <div className="text-xs text-gray-500">At least one contact method is required.</div>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>{error && (<motion.div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><Info className="h-5 w-5 flex-shrink-0 mt-0.5" /><div>{error}</div></motion.div>)}</AnimatePresence>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2" disabled={isLoading || !user} aria-busy={isLoading} aria-label="Submit found pet report">
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>) : ("Report Found Pet")}
            </Button>
          </motion.div>
        </form>
      </div>
      {/* Sidebar Section */}
      <aside className="hidden md:block">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 shadow">
          <div className="flex items-center gap-2 mb-2"><Info className="h-6 w-6 text-amber-600" /><span className="font-bold text-amber-800">Found Pet Tips</span></div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Check the <Link href="/map" className="underline">Lost &amp; Found Map</Link> for recent lost reports.</li>
            <li>Post on the <Link href="/community" className="underline">Community Board</Link> for local help.</li>
            <li>Bring the pet to a vet or shelter to check for a microchip.</li>
            <li>Share a photo on social media and neighborhood groups.</li>
            <li>Keep the pet safe and comfortable while searching for the owner.</li>
          </ul>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-6 shadow">
          <div className="font-bold text-amber-800 mb-2">What Happens Next?</div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Your report is shared with our network and volunteers</li>
            <li>AI will match the pet with lost reports and shelters</li>
            <li>You&apos;ll get notifications for possible matches</li>
            <li>Check your dashboard for updates and messages</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
