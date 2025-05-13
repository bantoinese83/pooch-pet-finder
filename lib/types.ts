export interface Pet {
  id: string
  imageUrl: string
  petType?: string
  breeds?: string[]
  colors?: string[]
  size?: string
  age?: string
  gender?: string
  location?: string
  coordinates?: {
    lat: number
    lng: number
  }
  description?: string
  distinctiveFeatures?: string[]
  dayFound?: string
}

export interface Shelter {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  website?: string
  distance?: number // in miles
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface PetMatch extends Pet {
  matchConfidence: number // 0-1 value representing match confidence
  name?: string
  foundDate: string
  shelter: Shelter
}

export interface PetBreed {
  value: string
  label: string
  petType: string
}

export interface PetColor {
  value: string
  label: string
}

export interface PetSize {
  value: string
  label: string
}

export interface PetAge {
  value: string
  label: string
}

export interface PetGender {
  value: string
  label: string
}

export interface PetFeature {
  value: string
  label: string
}
