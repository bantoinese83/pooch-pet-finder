import type { PetBreed, PetColor, PetSize, PetAge, PetGender, PetFeature } from "./types"

export const petTypes = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "rabbit", label: "Rabbit" },
  { value: "small-animal", label: "Small Animal" },
  { value: "reptile", label: "Reptile" },
  { value: "other", label: "Other" },
]

export const dogBreeds: PetBreed[] = [
  { value: "golden-retriever", label: "Golden Retriever", petType: "dog" },
  { value: "labrador", label: "Labrador Retriever", petType: "dog" },
  { value: "german-shepherd", label: "German Shepherd", petType: "dog" },
  { value: "beagle", label: "Beagle", petType: "dog" },
  { value: "poodle", label: "Poodle", petType: "dog" },
  { value: "bulldog", label: "Bulldog", petType: "dog" },
  { value: "boxer", label: "Boxer", petType: "dog" },
  { value: "rottweiler", label: "Rottweiler", petType: "dog" },
  { value: "dachshund", label: "Dachshund", petType: "dog" },
  { value: "shih-tzu", label: "Shih Tzu", petType: "dog" },
  { value: "husky", label: "Husky", petType: "dog" },
  { value: "chihuahua", label: "Chihuahua", petType: "dog" },
  { value: "great-dane", label: "Great Dane", petType: "dog" },
  { value: "doberman", label: "Doberman", petType: "dog" },
  { value: "australian-shepherd", label: "Australian Shepherd", petType: "dog" },
  { value: "border-collie", label: "Border Collie", petType: "dog" },
  { value: "mixed-breed-dog", label: "Mixed Breed", petType: "dog" },
]

export const catBreeds: PetBreed[] = [
  { value: "siamese", label: "Siamese", petType: "cat" },
  { value: "persian", label: "Persian", petType: "cat" },
  { value: "maine-coon", label: "Maine Coon", petType: "cat" },
  { value: "ragdoll", label: "Ragdoll", petType: "cat" },
  { value: "bengal", label: "Bengal", petType: "cat" },
  { value: "sphynx", label: "Sphynx", petType: "cat" },
  { value: "british-shorthair", label: "British Shorthair", petType: "cat" },
  { value: "abyssinian", label: "Abyssinian", petType: "cat" },
  { value: "scottish-fold", label: "Scottish Fold", petType: "cat" },
  { value: "birman", label: "Birman", petType: "cat" },
  { value: "russian-blue", label: "Russian Blue", petType: "cat" },
  { value: "norwegian-forest", label: "Norwegian Forest", petType: "cat" },
  { value: "domestic-shorthair", label: "Domestic Shorthair", petType: "cat" },
  { value: "domestic-longhair", label: "Domestic Longhair", petType: "cat" },
  { value: "mixed-breed-cat", label: "Mixed Breed", petType: "cat" },
]

export const birdBreeds: PetBreed[] = [
  { value: "parakeet", label: "Parakeet", petType: "bird" },
  { value: "cockatiel", label: "Cockatiel", petType: "bird" },
  { value: "canary", label: "Canary", petType: "bird" },
  { value: "lovebird", label: "Lovebird", petType: "bird" },
  { value: "finch", label: "Finch", petType: "bird" },
  { value: "parrot", label: "Parrot", petType: "bird" },
  { value: "cockatoo", label: "Cockatoo", petType: "bird" },
  { value: "macaw", label: "Macaw", petType: "bird" },
  { value: "conure", label: "Conure", petType: "bird" },
]

export const petColors: PetColor[] = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "gray", label: "Gray" },
  { value: "brown", label: "Brown" },
  { value: "tan", label: "Tan" },
  { value: "golden", label: "Golden" },
  { value: "cream", label: "Cream" },
  { value: "red", label: "Red" },
  { value: "blue", label: "Blue" },
  { value: "silver", label: "Silver" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "spotted", label: "Spotted" },
  { value: "striped", label: "Striped" },
  { value: "brindle", label: "Brindle" },
  { value: "calico", label: "Calico" },
  { value: "tabby", label: "Tabby" },
  { value: "tortoiseshell", label: "Tortoiseshell" },
]

export const petSizes: PetSize[] = [
  { value: "very-small", label: "Very Small (0-10 lbs)" },
  { value: "small", label: "Small (10-25 lbs)" },
  { value: "medium", label: "Medium (25-50 lbs)" },
  { value: "large", label: "Large (50-90 lbs)" },
  { value: "very-large", label: "Very Large (90+ lbs)" },
]

export const petAges: PetAge[] = [
  { value: "baby", label: "Baby" },
  { value: "young", label: "Young" },
  { value: "adult", label: "Adult" },
  { value: "senior", label: "Senior" },
]

export const petGenders: PetGender[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unknown", label: "Unknown" },
]

export const petFeatures: PetFeature[] = [
  { value: "microchipped", label: "Microchipped" },
  { value: "collar", label: "Wearing Collar" },
  { value: "id-tag", label: "ID Tag" },
  { value: "friendly", label: "Friendly" },
  { value: "shy", label: "Shy" },
  { value: "injured", label: "Injured" },
  { value: "special-needs", label: "Special Needs" },
  { value: "declawed", label: "Declawed" },
  { value: "house-trained", label: "House Trained" },
  { value: "spayed-neutered", label: "Spayed/Neutered" },
]

export const getBreedsByPetType = (petType: string): PetBreed[] => {
  switch (petType) {
    case "dog":
      return dogBreeds
    case "cat":
      return catBreeds
    case "bird":
      return birdBreeds
    default:
      return []
  }
}
