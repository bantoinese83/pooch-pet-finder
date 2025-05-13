import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

export default async function PetDetailsPage({ params }: { params: { id: string } }) {
  const { data: pet, error } = await supabase.from("pet_reports").select("*").eq("id", params.id).single()
  if (error || !pet) {
    return <div className="max-w-lg mx-auto py-16 text-center text-red-600">Pet not found.</div>
  }
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center">
        {pet.image_url && (
          <Image src={pet.image_url} alt={pet.pet_name || "Pet"} width={320} height={320} className="rounded-lg mb-4 object-cover w-full max-w-xs h-64 bg-gray-100" />
        )}
        <h1 className="text-3xl font-bold text-amber-800 mb-2">{pet.pet_name || "Unnamed Pet"}</h1>
        {pet.report_type === 'found' && pet.reward_claim && pet.reward_claim > 0 && (
          <div className="mb-2 flex items-center justify-center">
            <span className="inline-block bg-green-100 text-green-900 font-semibold px-4 py-1 rounded-full shadow animate-pulse text-lg">
              Reward Claimed: ${pet.reward_claim}
            </span>
          </div>
        )}
        {pet.reward && pet.reward > 0 && (
          <div className="mb-2 flex items-center justify-center">
            <span className="inline-block bg-yellow-200 text-yellow-900 font-semibold px-4 py-1 rounded-full shadow animate-pulse text-lg">
              Reward Offered: ${pet.reward}
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-sm text-gray-700 mb-2">
          <span className="bg-amber-100 px-2 py-1 rounded">{pet.report_type?.toUpperCase()}</span>
          <span className="bg-gray-100 px-2 py-1 rounded">{pet.status}</span>
          <span className="bg-gray-100 px-2 py-1 rounded">{pet.pet_type}</span>
          {pet.gender && <span className="bg-gray-100 px-2 py-1 rounded">{pet.gender}</span>}
          {pet.size && <span className="bg-gray-100 px-2 py-1 rounded">{pet.size}</span>}
          {pet.age && <span className="bg-gray-100 px-2 py-1 rounded">{pet.age}</span>}
        </div>
        <div className="mb-2">
          {pet.breeds && pet.breeds.length > 0 && <span className="mr-2">Breeds: {pet.breeds.join(", ")}</span>}
          {pet.colors && pet.colors.length > 0 && <span>Colors: {pet.colors.join(", ")}</span>}
        </div>
        {pet.location && <div className="mb-2 text-gray-600">Location: {pet.location}</div>}
        {pet.distinctive_features && pet.distinctive_features.length > 0 && (
          <div className="mb-2 text-gray-600">Distinctive Features: {pet.distinctive_features.join(", ")}</div>
        )}
        {pet.description && <div className="mb-4 text-gray-700">{pet.description}</div>}
        <div className="text-xs text-gray-400">Reported: {new Date(pet.created_at).toLocaleString()}</div>
      </div>
    </div>
  )
} 