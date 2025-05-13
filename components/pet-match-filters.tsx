"use client"

import { useState, useEffect } from "react"
import type { PetMatch } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PetMatchFiltersProps {
  matches: PetMatch[]
  onFilterChange: (filtered: PetMatch[]) => void
}

export function PetMatchFilters({ matches, onFilterChange }: PetMatchFiltersProps) {
  const [minConfidence, setMinConfidence] = useState(0)
  const [maxDistance, setMaxDistance] = useState(100)
  const [selectedShelters, setSelectedShelters] = useState<string[]>([])
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<string>("all")

  // Get unique shelters and pet types from matches
  const shelters = [...new Set(matches.map((match) => match.shelter.name))]
  const petTypes = [...new Set(matches.map((match) => match.petType).filter(Boolean))]

  useEffect(() => {
    let filtered = [...matches]

    // Filter by confidence
    filtered = filtered.filter((match) => match.matchConfidence >= minConfidence / 100)

    // Filter by distance (if we had actual distance data)
    // This is a placeholder since we don't have real distance data
    if (maxDistance < 100) {
      filtered = filtered.filter((match) => (match.shelter.distance ? match.shelter.distance <= maxDistance : true))
    }

    // Filter by selected shelters
    if (selectedShelters.length > 0) {
      filtered = filtered.filter((match) => selectedShelters.includes(match.shelter.name))
    }

    // Filter by pet types
    if (selectedPetTypes.length > 0) {
      filtered = filtered.filter((match) => match.petType && selectedPetTypes.includes(match.petType))
    }

    // Filter by date range
    const now = new Date()
    if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter((match) => new Date(match.foundDate) >= weekAgo)
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter((match) => new Date(match.foundDate) >= monthAgo)
    }

    onFilterChange(filtered)
  }, [minConfidence, maxDistance, selectedShelters, selectedPetTypes, dateRange, matches, onFilterChange])

  const handleShelterChange = (shelter: string) => {
    setSelectedShelters((prev) => (prev.includes(shelter) ? prev.filter((s) => s !== shelter) : [...prev, shelter]))
  }

  const handlePetTypeChange = (petType: string) => {
    setSelectedPetTypes((prev) => (prev.includes(petType) ? prev.filter((t) => t !== petType) : [...prev, petType]))
  }

  const resetFilters = () => {
    setMinConfidence(0)
    setMaxDistance(100)
    setSelectedShelters([])
    setSelectedPetTypes([])
    setDateRange("all")
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="space-y-4">
        <h3 className="font-medium text-amber-800">Match Confidence</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Min: {minConfidence}%</span>
          </div>
          <Slider
            value={[minConfidence]}
            min={0}
            max={100}
            step={5}
            onValueChange={(value) => setMinConfidence(value[0])}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-amber-800">Distance</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Max: {maxDistance} miles</span>
          </div>
          <Slider
            value={[maxDistance]}
            min={5}
            max={100}
            step={5}
            onValueChange={(value) => setMaxDistance(value[0])}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-amber-800">Date Found</h3>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger>
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 lg:col-span-1 md:col-span-2">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-amber-800">Pet Type</h3>
          {selectedPetTypes.length > 0 && (
            <Button
              variant="link"
              className="text-xs text-amber-600 h-auto p-0"
              onClick={() => setSelectedPetTypes([])}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {petTypes.map(
            (petType) =>
              petType && (
                <div key={petType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pet-type-${petType}`}
                    checked={selectedPetTypes.includes(petType)}
                    onCheckedChange={() => handlePetTypeChange(petType)}
                  />
                  <Label htmlFor={`pet-type-${petType}`} className="text-sm">
                    {petType}
                  </Label>
                </div>
              ),
          )}
        </div>
      </div>

      <div className="space-y-4 md:col-span-2">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-amber-800">Shelters</h3>
          {selectedShelters.length > 0 && (
            <Button
              variant="link"
              className="text-xs text-amber-600 h-auto p-0"
              onClick={() => setSelectedShelters([])}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {shelters.map((shelter) => (
            <div key={shelter} className="flex items-center space-x-2">
              <Checkbox
                id={`shelter-${shelter}`}
                checked={selectedShelters.includes(shelter)}
                onCheckedChange={() => handleShelterChange(shelter)}
              />
              <Label htmlFor={`shelter-${shelter}`} className="text-sm">
                {shelter}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 lg:col-span-4 flex justify-end">
        <Button variant="outline" className="text-amber-600" onClick={resetFilters}>
          Reset All Filters
        </Button>
      </div>
    </div>
  )
}
