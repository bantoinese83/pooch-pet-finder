import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/multi-select"

interface PetDetailsSectionProps {
  petName: string
  setPetName: (name: string) => void
  petType: string
  setPetType: (type: string) => void
  breeds: string[]
  setBreeds: (breeds: string[]) => void
  availableBreeds: { value: string; label: string }[]
  colors: string[]
  setColors: (colors: string[]) => void
  petTypes: { value: string; label: string }[]
  petColors: { value: string; label: string }[]
}

export function PetDetailsSection({
  petName, setPetName, petType, setPetType, breeds, setBreeds, availableBreeds, colors, setColors, petTypes, petColors
}: PetDetailsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pet-name" className="text-amber-800 font-medium">Pet&apos;s Name</Label>
          <Input id="pet-name" value={petName} onChange={e => setPetName(e.target.value)} placeholder="Enter your pet&apos;s name" className="border-amber-200 focus:ring-amber-500" />
          <div className="text-xs text-gray-500">Optional, but helps us personalize your search.</div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pet-type" className="text-amber-800 font-medium">Pet Type <span className="text-red-500">*</span></Label>
          <Select value={petType} onValueChange={setPetType} required>
            <SelectTrigger id="pet-type" className="border-amber-200 focus:ring-amber-500"><SelectValue placeholder="Select pet type" /></SelectTrigger>
            <SelectContent>{petTypes.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent>
          </Select>
          <div className="text-xs text-gray-500">Choose the closest match for your pet.</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(petType || breeds.length > 0) && (
          <div className="space-y-2">
            <Label htmlFor="breeds" className="text-amber-800 font-medium">Breed(s)</Label>
            <MultiSelect options={availableBreeds} selected={breeds} onChange={setBreeds} placeholder="Select breed(s)" emptyMessage={petType ? "No breeds found." : "Select a pet type first."} className="border-amber-200 focus-within:ring-amber-500" />
            <div className="text-xs text-gray-500">Select all that apply. Leave blank if unsure.</div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="colors" className="text-amber-800 font-medium">Color(s) <span className="text-red-500">*</span></Label>
          <MultiSelect options={petColors} selected={colors} onChange={setColors} placeholder="Select color(s)" className="border-amber-200 focus-within:ring-amber-500" />
          <div className="text-xs text-gray-500">Select all that apply.</div>
        </div>
      </div>
    </>
  )
} 