import { notFound } from "next/navigation"
import { ResultsHeader } from "@/components/results-header"
import { PetMatchGrid } from "@/components/pet-match-grid"
import { getPetMatches } from "@/lib/pet-matches"
import { Loader2 } from "lucide-react"
import type { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/constants"

interface ResultsPageProps {
  params: {
    searchId: string
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: ResultsPageProps): Promise<Metadata> {
  try {
    const { searchId } = params
    const { originalPet, matches } = await getPetMatches(searchId)

    if (!originalPet) {
      return {
        title: "Search Not Found",
        description: "The requested pet search could not be found.",
      }
    }

    const petType = originalPet.petType || "pet"
    const breeds = originalPet.breeds?.join(", ") || ""
    const title = `${matches.length} Potential Matches Found | ${SITE_NAME}`
    const description = `We found ${matches.length} potential matches for your ${breeds ? `${breeds} ` : ""}${petType}. View and contact shelters now.`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${SITE_URL}/results/${searchId}`,
        images: [
          {
            url: `${SITE_URL}/api/og?title=${encodeURIComponent(`${matches.length} Matches Found`)}&subtitle=${encodeURIComponent(`For your ${petType}`)}&type=results`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [
          `${SITE_URL}/api/og?title=${encodeURIComponent(`${matches.length} Matches Found`)}&subtitle=${encodeURIComponent(`For your ${petType}`)}&type=results`,
        ],
      },
    }
  } catch (error) {
    return {
      title: "Pet Search Results",
      description: "View potential matches for your lost pet.",
    }
  }
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { searchId } = params

  try {
    // Add a timeout to prevent hanging if the database or AWS calls take too long
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 30000))

    const resultsPromise = getPetMatches(searchId)

    // Race the results promise against the timeout
    const { originalPet, matches } = (await Promise.race([resultsPromise, timeoutPromise])) as Awaited<
      typeof resultsPromise
    >

    if (!originalPet) {
      notFound()
    }

    // Structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: matches.map((match, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing",
          name: match.name || `${match.petType} at ${match.shelter.name}`,
          description: match.description || `Found on ${new Date(match.foundDate).toLocaleDateString()}`,
          image: match.imageUrl,
        },
      })),
    }

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
          <ResultsHeader originalPet={originalPet} matchCount={matches.length} />
          <div className="container mx-auto px-4 py-12">
            <PetMatchGrid matches={matches} originalPet={originalPet} />
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error("Error fetching results:", error)

    // Return a more user-friendly error page
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 text-amber-600 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-amber-800 mb-2">Processing Your Search</h1>
          <p className="text-gray-600 mb-6">
            We're analyzing your pet's photo and searching for matches. This may take a moment.
          </p>
          <p className="text-sm text-gray-500">Search ID: {searchId}</p>
        </div>
      </main>
    )
  }
}
