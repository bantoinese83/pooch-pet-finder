"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Share2, Edit, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Pet } from "@/lib/types"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface ResultsHeaderProps {
  originalPet: Pet
  matchCount: number
}

export function ResultsHeader({ originalPet, matchCount }: ResultsHeaderProps) {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false)
  const router = useRouter()

  // Create the Google Maps embed URL safely
  const getMapEmbedUrl = () => {
    if (!originalPet.coordinates) return null

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    if (!apiKey) return null

    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${originalPet.coordinates.lat},${originalPet.coordinates.lng}&zoom=15`
  }

  const mapEmbedUrl = getMapEmbedUrl()

  // Format the day found date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date"

    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const shareSearch = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "POOCH - Lost Pet Search",
          text: "Help me find my lost pet!",
          url: window.location.href,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      setIsShareMenuOpen(!isShareMenuOpen)
    }
  }

  return (
    <div className="bg-amber-100 py-8">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Link
            href="/"
            className="inline-flex items-center text-amber-800 hover:text-amber-600 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to search
          </Link>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <motion.div
            className="flex-shrink-0 mx-auto md:mx-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-200 rounded-lg opacity-50 blur-sm" />
              <Image
                src={originalPet.imageUrl || "/placeholder.svg"}
                alt="Your pet"
                width={200}
                height={200}
                className="relative rounded-lg object-cover border-2 border-white shadow-md"
              />
            </div>
          </motion.div>

          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-amber-800 mb-2">Potential Matches</h1>
            <p className="text-lg text-amber-700 mb-4">We found {matchCount} potential matches for your pet</p>

            <motion.div
              className="bg-white p-4 rounded-lg shadow-sm mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="font-medium text-amber-800 mb-2">Your Pet Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {originalPet.petType && (
                  <div>
                    <span className="text-gray-500">Type:</span> {originalPet.petType}
                  </div>
                )}
                {originalPet.breeds && originalPet.breeds.length > 0 && (
                  <div>
                    <span className="text-gray-500">Breed:</span> {originalPet.breeds.join(", ")}
                  </div>
                )}
                {originalPet.gender && (
                  <div>
                    <span className="text-gray-500">Gender:</span> {originalPet.gender}
                  </div>
                )}
                {originalPet.age && (
                  <div>
                    <span className="text-gray-500">Age:</span> {originalPet.age}
                  </div>
                )}
                {originalPet.dayFound && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-amber-600" />
                    <span className="text-gray-500">Day Found:</span> {formatDate(originalPet.dayFound)}
                  </div>
                )}
                {originalPet.colors && originalPet.colors.length > 0 && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-gray-500">Colors:</span>{" "}
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {originalPet.colors.map((color) => (
                        <Badge key={color} variant="outline" className="text-xs">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {originalPet.distinctiveFeatures && originalPet.distinctiveFeatures.length > 0 && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-gray-500">Features:</span>{" "}
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {originalPet.distinctiveFeatures.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {originalPet.location && (
              <motion.div
                className="bg-white p-4 rounded-lg shadow-sm mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="font-medium text-amber-800 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-amber-600" />
                  Last Seen Location
                </h2>
                <p className="text-sm">{originalPet.location}</p>
                {mapEmbedUrl ? (
                  <div className="mt-2 h-[150px] rounded-md overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={mapEmbedUrl}
                      allowFullScreen
                      loading="lazy"
                      title="Last seen location map"
                    ></iframe>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-500">
                    No precise coordinates available
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Button
                variant="outline"
                className="text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={() => router.push("/")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Search
              </Button>
              <div className="relative">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={shareSearch}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Search
                </Button>

                {isShareMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1">
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      >
                        Share on Facebook
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent("Help me find my lost pet!")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      >
                        Share on Twitter
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          setIsShareMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
