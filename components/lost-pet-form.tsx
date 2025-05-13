"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Calendar, MapPin, Info, Sparkles, Lightbulb, Send, Bot, Bell, LayoutDashboard, UploadCloud, Dog, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LocationMap } from "@/components/location-map"
import { petTypes, petColors, petSizes, petAges, petGenders, petFeatures, getBreedsByPetType } from "@/lib/pet-data"
import { MAX_UPLOAD_SIZE, SUPPORTED_IMAGE_TYPES } from "@/lib/constants"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { generatePetDescriptionFromImage } from "@/lib/gemini"
import { supabase } from "@/lib/supabase-client"
import Link from "next/link"
import { PhotoUploadSection } from "@/components/lost-pet-form/PhotoUploadSection"
import { PetDetailsSection } from "@/components/lost-pet-form/PetDetailsSection"
import { AdvancedOptionsSection } from "@/components/lost-pet-form/AdvancedOptionsSection"

const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
// const Webcam = dynamic(() => import("react-webcam"), { ssr: false })

// Helper: map AI tags and description to form fields, robustly inferring petType from breed if needed
function mapTagsToFormFields(tags: string[], desc: string) {
  const lowerTags = tags.map(t => t.toLowerCase())
  // Pet type
  let petType = petTypes.find(type => lowerTags.includes(type.label.toLowerCase()) || lowerTags.includes(type.value))?.value || ""
  // Breeds (try to detect even if petType is not set)
  let breeds: string[] = []
  let detectedBreedType: string | null = null
  for (const type of petTypes) {
    const breedList = getBreedsByPetType(type.value)
    const foundBreeds = breedList.filter(breed => lowerTags.includes(breed.label.toLowerCase()) || lowerTags.includes(breed.value) || desc.toLowerCase().includes(breed.label.toLowerCase()))
    if (foundBreeds.length) {
      breeds = foundBreeds.map(b => b.value)
      detectedBreedType = type.value
      break
    }
  }
  // If breed detected but petType not set, infer petType from breed
  if (!petType && detectedBreedType) {
    petType = detectedBreedType
  }
  // Colors
  const colors = petColors.filter(color => lowerTags.includes(color.label.toLowerCase()) || lowerTags.includes(color.value) || desc.toLowerCase().includes(color.label.toLowerCase())).map(c => c.value)
  // Name: try to extract from desc (e.g., "This is <name>.")
  let petName = ""
  const nameMatch = desc.match(/(?:named|name is|this is|meet) ([A-Z][a-zA-Z]+)/i)
  if (nameMatch) petName = nameMatch[1]
  // Size
  const size = petSizes.find(s => lowerTags.includes(s.label.toLowerCase()) || desc.toLowerCase().includes(s.label.toLowerCase()))?.value || ""
  // Age
  const age = petAges.find(a => lowerTags.includes(a.label.toLowerCase()) || desc.toLowerCase().includes(a.label.toLowerCase()))?.value || ""
  // Gender
  const gender = petGenders.find(g => lowerTags.includes(g.label.toLowerCase()) || desc.toLowerCase().includes(g.label.toLowerCase()))?.value || ""
  // Distinctive Features
  const distinctiveFeatures = petFeatures.filter(f => lowerTags.includes(f.label.toLowerCase()) || desc.toLowerCase().includes(f.label.toLowerCase())).map(f => f.value)
  return { petType, colors, breeds, petName, size, age, gender, distinctiveFeatures }
}

export function LostPetForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [petType, setPetType] = useState<string>("")
  const [breeds, setBreeds] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [size, setSize] = useState<string>("")
  const [age, setAge] = useState<string>("")
  const [gender, setGender] = useState<string>("")
  const [petName, setPetName] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [description, setDescription] = useState<string>("")
  const [distinctiveFeatures, setDistinctiveFeatures] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [availableBreeds, setAvailableBreeds] = useState<{ value: string; label: string }[]>([])
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [lastSeenDate, setLastSeenDate] = useState<string>(new Date().toISOString().split("T")[0]) // Default to today
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  // Camera input ref for direct capture
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const webcamRef = React.useRef(null)
  const [user, setUser] = useState<any>(null)
  // Add a ref to track if AI is setting petType and breeds
  const aiSetPetType = React.useRef<string | null>(null)
  const aiSetBreeds = React.useRef<string[] | null>(null)
  // Store the initial location value for the map, so it only gets set once (on mount)
  const initialLocationRef = React.useRef<string>("");
  const [reward, setReward] = useState<string>("")
  React.useEffect(() => {
    if (!initialLocationRef.current && location) {
      initialLocationRef.current = location;
    }
    // Do not update after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update available breeds and set breeds if AI has set them
  useEffect(() => {
    if (petType) {
      const breedsList = getBreedsByPetType(petType)
      setAvailableBreeds(breedsList)
      // If AI set breeds, set them after availableBreeds updates
      if (aiSetBreeds.current) {
        setBreeds(aiSetBreeds.current)
        aiSetBreeds.current = null
      } else {
        setBreeds([])
      }
    } else {
      setAvailableBreeds([])
      setBreeds([])
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

  // Memoize the location select handler to prevent unnecessary re-renders
  const handleLocationSelect = React.useCallback((coords: { lat: number; lng: number; address: string }) => {
    setCoordinates(coords)
    setLocation(coords.address)
  }, [setCoordinates, setLocation])

  // Memoize the map to prevent remounts and repeated API requests
  const memoizedMap = React.useMemo(() => (
    <LocationMap
      onLocationSelect={handleLocationSelect}
      initialAddress={initialLocationRef.current}
    />
  ), [handleLocationSelect, initialLocationRef]);

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
      formData.append("reportType", "lost") // Indicate this is a lost pet report

      // Add pet name if provided
      if (petName) {
        formData.append("petName", petName)
      }

      // Add arrays as JSON strings
      formData.append("breeds", JSON.stringify(breeds))
      formData.append("colors", JSON.stringify(colors))
      formData.append("distinctiveFeatures", JSON.stringify(distinctiveFeatures))

      // Add other fields
      formData.append("size", size)
      formData.append("age", age)
      formData.append("gender", gender)
      formData.append("location", location)
      formData.append("lastSeenDate", lastSeenDate) // Add the last seen date field

      // Add coordinates if available
      if (coordinates) {
        formData.append("coordinates", JSON.stringify(coordinates))
      }

      formData.append("description", description)

      // Add reward if provided
      if (reward) {
        formData.append("reward", reward)
      }

      // Get the user's access token
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      // Upload to API with Authorization header
      const response = await fetch("/api/lost-pet", {
        method: "POST",
        body: formData,
        headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to upload image")
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
    <div className="max-w-5xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Main Form Section */}
      <div className="md:col-span-2">
        {/* Hero Section */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-8 w-8 text-amber-600 animate-pulse" />
          <h1 className="text-4xl font-bold text-amber-800">Report a Lost Pet</h1>
        </div>
        <p className="text-gray-700 mb-6">Fill out the form below to report your lost pet. Our AI and community will help you search and get the word out fast!</p>
        {!user && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-4 mb-6 flex items-center gap-4">
            <Info className="h-6 w-6 text-amber-700" />
            <div>
              <b>Please sign in or create an account to report a lost pet.</b>
              <div className="mt-2">
                <a href="/login">
                  <Button variant="outline" className="border-amber-400 text-amber-800 hover:bg-amber-100">Sign In / Create Account</Button>
                </a>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md" aria-label="Lost Pet Report Form">
          {/* Photo Upload Section */}
          <PhotoUploadSection
            file={file}
            preview={preview}
            setFile={setFile}
            setPreview={setPreview}
            aiLoading={aiLoading}
            aiError={aiError}
            onAIDescribe={async () => {
              setAiLoading(true)
              setAiError(null)
              try {
                if (!file) return
                const reader = new FileReader()
                reader.onload = async (e) => {
                  const base64 = (e.target?.result as string)?.split(",")[1]
                  if (base64) {
                    const aiText = await generatePetDescriptionFromImage(base64)
                    if (!aiText) return
                    // Robustly extract description and tags
                    let desc = aiText
                    let tagsRaw = ""
                    const tagMatch = aiText.match(/Tags?:\s*([\s\S]*)/i)
                    if (tagMatch) {
                      desc = aiText.slice(0, tagMatch.index).trim()
                      tagsRaw = tagMatch[1].replace(/\n/g, " ").trim()
                    }
                    if (!desc) desc = ""
                    // Clean up description: remove markdown, headings, boilerplate, and structured lines
                    desc = desc.replace(/(^|\n)(here'?s a description[^\n]*:|\*\*description:?\*\*|description:|\*\*|\*|^\s*\n)/gi, "")
                      .replace(/\*\*/g, "")
                      .replace(/\n+/g, " ")
                      .replace(/^(Breed|Color|Markings|Unique Features|Features|Distinctive Features):[^\n]*$/gim, "")
                      .replace(/\s{2,}/g, " ")
                      .replace(/^\s+|\s+$/g, "")
                    setDescription(desc.trim())
                    if (tagsRaw) {
                      const tags = tagsRaw.split(",").map(t => t.trim())
                      const { petType: aiPetType, colors: aiColors, breeds: aiBreeds, petName: aiPetName, size: aiSize, age: aiAge, gender: aiGender, distinctiveFeatures: aiFeatures } = mapTagsToFormFields(tags, desc)
                      if (aiPetType) {
                        aiSetPetType.current = aiPetType
                        setPetType(aiPetType)
                      }
                      if (aiBreeds.length) {
                        aiSetBreeds.current = aiBreeds
                        if (petType === aiSetPetType.current) {
                          setBreeds(aiBreeds)
                          aiSetBreeds.current = null
                        }
                      }
                      if (aiColors.length) setColors(aiColors)
                      if (aiPetName) setPetName(aiPetName)
                      if (aiSize) setSize(aiSize)
                      if (aiAge) setAge(aiAge)
                      if (aiGender) setGender(aiGender)
                      if (aiFeatures.length) setDistinctiveFeatures(aiFeatures)
                    }
                  }
                }
                reader.readAsDataURL(file)
              } catch (err) {
                setAiError("AI description failed. Please try again.")
              } finally {
                setAiLoading(false)
              }
            }}
            showCameraModal={showCameraModal}
            setShowCameraModal={setShowCameraModal}
            webcamRef={webcamRef}
            handleCapture={() => {}}
            cameraInputRef={cameraInputRef as React.RefObject<HTMLInputElement>}
            dragActive={dragActive}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleFileChange={handleFileChange}
            isMobile={isMobile}
          />

          {/* Pet Details Section */}
          <PetDetailsSection
            petName={petName}
            setPetName={setPetName}
            petType={petType}
            setPetType={setPetType}
            breeds={breeds}
            setBreeds={setBreeds}
            availableBreeds={availableBreeds}
            colors={colors}
            setColors={setColors}
            petTypes={petTypes}
            petColors={petColors}
          />

          {/* Reward Section */}
          <div className="space-y-2">
            <Label htmlFor="reward" className="text-amber-800 font-medium">Reward Offered (optional, $)</Label>
            <Input id="reward" type="number" min="0" step="1" value={reward} onChange={e => setReward(e.target.value)} placeholder="e.g. 100" className="border-amber-200 focus:ring-amber-500 max-w-xs" />
            <div className="text-xs text-gray-500">If you wish, offer a reward for your pet's safe return.</div>
          </div>

          {/* Advanced Options Toggle */}
          <motion.button type="button" variants={{ initial: { opacity: 0.8 }, hover: { opacity: 1, scale: 1.02 } }} initial="initial" whileHover="hover" className="text-amber-600 font-medium flex items-center gap-1 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md px-2 py-1" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} aria-expanded={showAdvancedOptions} aria-controls="advanced-options">
            <Settings className="h-4 w-4" aria-hidden="true" />
            {showAdvancedOptions ? "Hide advanced options" : "Show advanced options"}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${showAdvancedOptions ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </motion.button>
          <AnimatePresence>{showAdvancedOptions && (
            <motion.div id="advanced-options" className="space-y-6 border-t border-gray-200 pt-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
              <AdvancedOptionsSection
                size={size}
                setSize={setSize}
                age={age}
                setAge={setAge}
                gender={gender}
                setGender={setGender}
                distinctiveFeatures={distinctiveFeatures}
                setDistinctiveFeatures={setDistinctiveFeatures}
                description={description}
                setDescription={setDescription}
                petSizes={petSizes}
                petAges={petAges}
                petGenders={petGenders}
                petFeatures={petFeatures}
              />
            </motion.div>
          )}</AnimatePresence>

          {/* Last Seen Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last-seen-date" className="text-amber-800 font-medium flex items-center gap-1"><Calendar className="h-4 w-4" /> Last Seen Date <span className="text-red-500">*</span></Label>
              <Input id="last-seen-date" type="date" value={lastSeenDate} onChange={e => setLastSeenDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="border-amber-200 focus:ring-amber-500" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-amber-800 font-medium flex items-center gap-1"><MapPin className="h-4 w-4" /> Last Seen Location <span className="text-red-500">*</span></Label>
              <div className="flex gap-2 items-center">
                <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Address, intersection, or area" className="border-amber-200 focus:ring-amber-500 flex-1" required aria-required="true" />
                <Button type="button" variant="ghost" size="icon" aria-label="Use my current location" onClick={() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(pos => { setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocation(`Lat: ${pos.coords.latitude.toFixed(5)}, Lng: ${pos.coords.longitude.toFixed(5)}`); }); } }}><MapPin className="h-5 w-5" /></Button>
              </div>
              <div className="text-xs text-gray-500">Provide as much detail as possible. You can use your current location or pick on the map below.</div>
              <div className="mt-2">
                {memoizedMap}
              </div>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>{error && (<motion.div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><Info className="h-5 w-5 flex-shrink-0 mt-0.5" /><div>{error}</div></motion.div>)}</AnimatePresence>

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2" disabled={isLoading || !user} aria-busy={isLoading} aria-label="Submit lost pet report">
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>) : ("Report Lost Pet")}
            </Button>
          </motion.div>
        </form>
      </div>
      {/* Sidebar Section */}
      <aside className="hidden md:block">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 shadow">
          <div className="flex items-center gap-2 mb-2"><Lightbulb className="h-6 w-6 text-amber-600" aria-hidden="true" /><span className="font-bold text-amber-800">Lost Pet Search Tips</span></div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li>Check the <Link href="/map" className="underline">Lost &amp; Found Map</Link> for recent sightings.</li>
            <li>Share your report on the <Link href="/community" className="underline">Community Board</Link>.</li>
            <li>Read <Link href="/blog" className="underline">expert tips</Link> for finding lost pets.</li>
            <li>Contact nearby shelters and vets.</li>
            <li>Update your report if you get new info.</li>
          </ul>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-6 shadow">
          <div className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Send className="h-5 w-5 text-amber-500" aria-hidden="true" />What Happens Next?</div>
          <ul className="list-disc ml-6 text-amber-700 text-sm space-y-1">
            <li className="flex items-center gap-2"><Send className="h-4 w-4 text-amber-400" aria-hidden="true" />Your report is shared with our network and volunteers</li>
            <li className="flex items-center gap-2"><Bot className="h-4 w-4 text-amber-400" aria-hidden="true" />AI will match your pet with found reports and shelters</li>
            <li className="flex items-center gap-2"><Bell className="h-4 w-4 text-amber-400" aria-hidden="true" />You'll get notifications for possible matches</li>
            <li className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-amber-400" aria-hidden="true" />Check your dashboard for updates and messages</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
