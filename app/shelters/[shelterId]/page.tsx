import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import Image from "next/image";

async function fetchShelter(shelterId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/shelters/sync?id=${shelterId}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function fetchPets(shelterId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/shelters/pets?shelterId=${shelterId}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

interface Pet {
  id: string;
  name?: string;
  image_url?: string;
  pet_type?: string;
  breeds?: string[];
  description?: string;
  found_date?: string;
}

export default async function ShelterDetailsPage({ params }: { params: { shelterId: string } }) {
  const shelter = await fetchShelter(params.shelterId);
  if (!shelter) return notFound();
  const pets = await fetchPets(params.shelterId);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-amber-800 mb-2">{shelter.name}</h1>
        <div className="flex flex-wrap gap-4 items-center text-gray-700 mb-2">
          {shelter.address && (
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-amber-600" />{shelter.address}</span>
          )}
          {shelter.city && shelter.state && (
            <span>{shelter.city}, {shelter.state}</span>
          )}
          {shelter.phone && (
            <span className="flex items-center gap-1"><Phone className="h-4 w-4 text-amber-600" />{shelter.phone}</span>
          )}
          {shelter.email && (
            <span className="flex items-center gap-1"><Mail className="h-4 w-4 text-amber-600" />{shelter.email}</span>
          )}
          {shelter.website && (
            <a href={shelter.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-amber-700 hover:underline"><Globe className="h-4 w-4" />Website</a>
          )}
        </div>
        {shelter.description && <p className="text-gray-600 max-w-2xl mt-2">{shelter.description}</p>}
      </div>
      <h2 className="text-2xl font-bold text-amber-700 mb-4">Available Pets</h2>
      {pets.length === 0 ? (
        <div className="text-gray-500">No pets currently available at this shelter.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {pets.map((pet: Pet) => (
            <Card key={pet.id} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg text-amber-800 font-semibold">{pet.name || "Unnamed Pet"}</CardTitle>
              </CardHeader>
              <CardContent>
                {pet.image_url && (
                  <Image src={pet.image_url} alt={pet.name || "Pet"} width={400} height={192} className="rounded-md mb-2 w-full h-48 object-cover bg-gray-100" />
                )}
                <div className="text-gray-700 mb-1">{pet.pet_type} {pet.breeds && pet.breeds.length > 0 && `- ${pet.breeds.join(", ")}`}</div>
                {pet.description && <div className="text-sm text-gray-500 line-clamp-2 mb-1">{pet.description}</div>}
                {pet.found_date && <div className="text-xs text-gray-400">Found: {new Date(pet.found_date).toLocaleDateString()}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-8">
        <Link href="/shelters" className="text-amber-700 hover:underline">&larr; Back to all shelters</Link>
      </div>
    </div>
  );
} 