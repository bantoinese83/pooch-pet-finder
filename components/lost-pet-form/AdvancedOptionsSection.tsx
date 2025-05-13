import React from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/multi-select"
import { Textarea } from "@/components/ui/textarea"

interface AdvancedOptionsSectionProps {
  size: string
  setSize: (size: string) => void
  age: string
  setAge: (age: string) => void
  gender: string
  setGender: (gender: string) => void
  distinctiveFeatures: string[]
  setDistinctiveFeatures: (features: string[]) => void
  description: string
  setDescription: (desc: string) => void
  petSizes: { value: string; label: string }[]
  petAges: { value: string; label: string }[]
  petGenders: { value: string; label: string }[]
  petFeatures: { value: string; label: string }[]
}

export function AdvancedOptionsSection({
  size, setSize, age, setAge, gender, setGender, distinctiveFeatures, setDistinctiveFeatures, description, setDescription, petSizes, petAges, petGenders, petFeatures
}: AdvancedOptionsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="size" className="text-amber-800 font-medium">Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger id="size" className="border-amber-200 focus:ring-amber-500"><SelectValue placeholder="Select size" /></SelectTrigger>
            <SelectContent>{petSizes.map(size => (<SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="age" className="text-amber-800 font-medium">Age</Label>
          <Select value={age} onValueChange={setAge}>
            <SelectTrigger id="age" className="border-amber-200 focus:ring-amber-500"><SelectValue placeholder="Select age" /></SelectTrigger>
            <SelectContent>{petAges.map(age => (<SelectItem key={age.value} value={age.value}>{age.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-amber-800 font-medium">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender" className="border-amber-200 focus:ring-amber-500"><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>{petGenders.map(gender => (<SelectItem key={gender.value} value={gender.value}>{gender.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <Label htmlFor="distinctive-features" className="text-amber-800 font-medium">Distinctive Features</Label>
        <MultiSelect options={petFeatures} selected={distinctiveFeatures} onChange={setDistinctiveFeatures} placeholder="Select distinctive features" className="border-amber-200 focus-within:ring-amber-500" />
      </div>
      <div className="space-y-2 mt-4">
        <Label htmlFor="description" className="text-amber-800 font-medium">Additional Details</Label>
        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Any other distinguishing features, behavior, medical conditions, etc." rows={3} className="border-amber-200 focus:ring-amber-500" />
      </div>
    </>
  )
} 