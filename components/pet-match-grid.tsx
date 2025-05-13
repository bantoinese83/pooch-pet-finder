"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import type { Pet, PetMatch } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Phone, Calendar, ExternalLink, Filter, Map, Grid3X3 } from "lucide-react"
import { PetMatchFilters } from "@/components/pet-match-filters"
import { PetMatchMap } from "@/components/pet-match-map"
import { motion, AnimatePresence } from "framer-motion"

// Import the map utils
import { formatDistance, calculateDistance } from "@/lib/map-utils"

interface PetMatchGridProps {
  matches: PetMatch[]
  originalPet: Pet
}

export function PetMatchGrid({ matches, originalPet }: PetMatchGridProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filteredMatches, setFilteredMatches] = useState(matches)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [isLoaded, setIsLoaded] = useState(false)

  // Set isLoaded to true after initial render
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Add a function to calculate the distance between the original pet and the match
  const getDistance = (match: PetMatch): string | null => {
    if (originalPet.coordinates && match.shelter.coordinates) {
      const distance = calculateDistance(
        originalPet.coordinates.lat,
        originalPet.coordinates.lng,
        match.shelter.coordinates.lat,
        match.shelter.coordinates.lng,
      )
      return formatDistance(distance)
    }
    return match.shelter.distance ? formatDistance(match.shelter.distance) : null
  }

  const handleMarkerClick = (matchId: string) => {
    setSelectedMatchId(matchId)

    // Scroll to the match card if in grid view
    if (viewMode === "grid") {
      const element = document.getElementById(`match-${matchId}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <div>
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-amber-800">{filteredMatches.length} Potential Matches</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Tabs
            defaultValue="grid"
            className="w-full sm:w-[200px]"
            onValueChange={(value) => setViewMode(value as "grid" | "map")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Map className="h-4 w-4 mr-2" />
                Map
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PetMatchFilters matches={matches} onFilterChange={setFilteredMatches} />
          </motion.div>
        )}
      </AnimatePresence>

      {filteredMatches.length === 0 ? (
        <motion.div
          className="text-center py-12 bg-amber-50 rounded-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-500 mb-4">No matches found with the current filters.</p>
          <Button variant="link" className="text-amber-600" onClick={() => setFilteredMatches(matches)}>
            Reset filters
          </Button>
        </motion.div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            {viewMode === "map" && (
              <motion.div
                key="map-view"
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PetMatchMap matches={filteredMatches} originalPet={originalPet} onMarkerClick={handleMarkerClick} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${viewMode === "map" ? "mt-6" : ""}`}
            variants={container}
            initial="hidden"
            animate={isLoaded ? "show" : "hidden"}
          >
            {filteredMatches.map((match) => (
              <motion.div
                key={match.id}
                variants={item}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  id={`match-${match.id}`}
                  className={`overflow-hidden transition-all duration-300 h-full flex flex-col ${
                    selectedMatchId === match.id ? "ring-2 ring-amber-500" : ""
                  }`}
                  onClick={() => setSelectedMatchId(match.id)}
                >
                  <div className="relative h-48">
                    <Image
                      src={match.imageUrl || "/placeholder.svg"}
                      alt={match.name || "Pet"}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 text-white font-medium">
                        {Math.round(match.matchConfidence * 100)}% Match
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-amber-800">{match.name || "Unknown Name"}</h3>
                        <p className="text-gray-500 text-sm">
                          {match.breeds?.join(", ") || match.petType || "Unknown breed"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2 pb-2 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span className="truncate">{match.shelter.name}</span>
                      {getDistance(match) && (
                        <span className="text-gray-500 ml-1 flex-shrink-0">({getDistance(match)})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span>Found on {new Date(match.foundDate).toLocaleDateString()}</span>
                    </div>

                    {match.colors && match.colors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {match.colors.map((color) => (
                          <Badge key={color} variant="outline" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {match.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{match.description}</p>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between pt-2 mt-auto">
                    <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50">
                      <Phone className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}
