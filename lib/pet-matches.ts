import { S3Client } from "@aws-sdk/client-s3"
import { RekognitionClient, CompareFacesCommand, DetectLabelsCommand } from "@aws-sdk/client-rekognition"
import { createClient } from "@supabase/supabase-js"
import type { Pet, PetMatch } from "./types"
import { calculateDistance } from "./map-utils"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { generatePetDescriptionFromImage } from "./gemini"

// Initialize AWS clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Get pet matches based on search ID
 * This function retrieves the original pet details and potential matches from the database
 * It uses AWS Rekognition to compare images and calculate match confidence
 */
export async function getPetMatches(searchId: string): Promise<{ originalPet: Pet; matches: PetMatch[] }> {
  try {
    // 1. Fetch the original pet details from the database using searchId
    const { data: searchData, error: searchError } = await supabase
      .from("pet_searches")
      .select("*")
      .eq("id", searchId)
      .single()

    if (searchError || !searchData) {
      throw new Error(`Search not found: ${searchError?.message || "Unknown error"}`)
    }

    // 2. Convert the search data to a Pet object
    const originalPet: Pet = {
      id: searchData.id,
      imageUrl: searchData.image_url,
      petType: searchData.pet_type,
      breeds: searchData.breeds || [],
      colors: searchData.colors || [],
      size: searchData.size,
      age: searchData.age,
      gender: searchData.gender,
      location: searchData.location,
      coordinates: searchData.coordinates,
      description: searchData.description,
      distinctiveFeatures: searchData.distinctive_features || [],
    }

    // 3. Fetch potential matches from the shelter_pets table
    let query = supabase
      .from("shelter_pets")
      .select(
        `
        *,
        shelter:shelters(
          id, 
          name, 
          address, 
          city, 
          state, 
          zip, 
          phone, 
          email, 
          website, 
          coordinates
        )
      `,
      )
      .eq("status", "available")

    // Apply basic filters based on pet type
    if (originalPet.petType) {
      query = query.eq("pet_type", originalPet.petType)
    }

    const { data: potentialMatches, error: matchesError } = await query

    if (matchesError) {
      throw new Error(`Error fetching potential matches: ${matchesError.message}`)
    }

    // 4. Filter matches by additional criteria
    let filteredMatches = potentialMatches

    // Filter by breeds if specified
    if (originalPet.breeds && originalPet.breeds.length > 0) {
      filteredMatches = filteredMatches.filter((match) => {
        if (!match.breeds || match.breeds.length === 0) return false
        return originalPet.breeds.some((breed) => match.breeds.includes(breed))
      })
    }

    // Filter by colors if specified
    if (originalPet.colors && originalPet.colors.length > 0) {
      filteredMatches = filteredMatches.filter((match) => {
        if (!match.colors || match.colors.length === 0) return false
        return originalPet.colors.some((color) => match.colors.includes(color))
      })
    }

    // Filter by size if specified
    if (originalPet.size) {
      filteredMatches = filteredMatches.filter((match) => match.size === originalPet.size)
    }

    // Filter by age if specified
    if (originalPet.age) {
      filteredMatches = filteredMatches.filter((match) => match.age === originalPet.age)
    }

    // Filter by gender if specified
    if (originalPet.gender) {
      filteredMatches = filteredMatches.filter((match) => match.gender === originalPet.gender)
    }

    // 5. Calculate distance if coordinates are provided
    if (originalPet.coordinates && originalPet.coordinates.lat && originalPet.coordinates.lng) {
      filteredMatches = filteredMatches.map((match) => {
        if (match.shelter && match.shelter.coordinates) {
          const distance = calculateDistance(
            originalPet.coordinates.lat,
            originalPet.coordinates.lng,
            match.shelter.coordinates.lat,
            match.shelter.coordinates.lng,
          )
          return { ...match, distance }
        }
        return match
      })
    }

    // 6. Use AWS Rekognition to compare images and calculate match confidence
    const matches: PetMatch[] = await Promise.all(
      filteredMatches.map(async (match) => {
        let matchConfidence = 0.5 // Default confidence

        try {
          // Extract S3 keys from URLs
          const originalImageKey = getS3KeyFromUrl(originalPet.imageUrl)
          const matchImageKey = getS3KeyFromUrl(match.image_url)

          let geminiScore = null

          if (originalImageKey && matchImageKey) {
            // Try face comparison first (works well for some pets with distinct facial features)
            try {
              const compareFacesParams = {
                SourceImage: {
                  S3Object: {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Name: originalImageKey,
                  },
                },
                TargetImage: {
                  S3Object: {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Name: matchImageKey,
                  },
                },
                SimilarityThreshold: 70,
              }

              const compareFacesResponse = await rekognitionClient.send(new CompareFacesCommand(compareFacesParams))

              if (compareFacesResponse.FaceMatches && compareFacesResponse.FaceMatches.length > 0) {
                // If faces are found, use the similarity score
                matchConfidence = (compareFacesResponse.FaceMatches[0].Similarity || 70) / 100
              }
            } catch (faceError) {
              // Face comparison failed or no faces found, which is expected for many pet photos
              // Continue with label detection
            }

            // If face comparison didn't yield high confidence, try label detection
            if (matchConfidence <= 0.7) {
              // Detect labels in both images
              const [sourceLabelsResponse, targetLabelsResponse] = await Promise.all([
                rekognitionClient.send(
                  new DetectLabelsCommand({
                    Image: {
                      S3Object: {
                        Bucket: process.env.AWS_S3_BUCKET_NAME,
                        Name: originalImageKey,
                      },
                    },
                    MaxLabels: 50,
                    MinConfidence: 70,
                  }),
                ),
                rekognitionClient.send(
                  new DetectLabelsCommand({
                    Image: {
                      S3Object: {
                        Bucket: process.env.AWS_S3_BUCKET_NAME,
                        Name: matchImageKey,
                      },
                    },
                    MaxLabels: 50,
                    MinConfidence: 70,
                  }),
                ),
              ])

              // Calculate similarity based on common labels
              const sourceLabels = sourceLabelsResponse.Labels || []
              const targetLabels = targetLabelsResponse.Labels || []

              const sourceLabelsMap = new Map(sourceLabels.map((label) => [label.Name, label.Confidence]))
              const targetLabelsMap = new Map(targetLabels.map((label) => [label.Name, label.Confidence]))

              let totalScore = 0
              let matchCount = 0

              // Calculate similarity based on common labels and their confidence scores
              for (const [labelName, sourceConfidence] of sourceLabelsMap.entries()) {
                if (targetLabelsMap.has(labelName)) {
                  const targetConfidence = targetLabelsMap.get(labelName) || 0
                  // Weight the score by the average confidence
                  const weightedScore = ((sourceConfidence || 0) + (targetConfidence || 0)) / 2 / 100
                  totalScore += weightedScore
                  matchCount++
                }
              }

              // Normalize the score
              const labelSimilarity = matchCount > 0 ? totalScore / matchCount : 0

              // If we already have a face match confidence, combine it with label similarity
              if (matchConfidence > 0.5) {
                matchConfidence = matchConfidence * 0.7 + labelSimilarity * 0.3
              } else {
                matchConfidence = labelSimilarity
              }
            }

            // --- Gemini image understanding integration ---
            try {
              // Helper to fetch S3 object and convert to base64
              async function getS3ImageBase64(key: string): Promise<string | null> {
                const obj = await s3Client.send(new GetObjectCommand({
                  Bucket: process.env.AWS_S3_BUCKET_NAME,
                  Key: key,
                }))
                const arrayBuffer = await obj.Body?.transformToByteArray()
                if (!arrayBuffer) return null
                const base64 = Buffer.from(arrayBuffer).toString("base64")
                return base64
              }

              const [originalBase64, matchBase64] = await Promise.all([
                getS3ImageBase64(originalImageKey),
                getS3ImageBase64(matchImageKey),
              ])

              if (originalBase64 && matchBase64) {
                // Use Gemini to generate pet descriptions/tags for both images
                const [originalDesc, matchDesc] = await Promise.all([
                  generatePetDescriptionFromImage(originalBase64),
                  generatePetDescriptionFromImage(matchBase64),
                ])
                // Extract tags from Gemini output (expects "Tags: ...")
                function extractTags(desc: string): string[] {
                  const match = desc.match(/Tags:\s*(.*)/i)
                  if (match && match[1]) {
                    return match[1].split(",").map((t) => t.trim().toLowerCase())
                  }
                  return []
                }
                const originalTags = extractTags(originalDesc)
                const matchTags = extractTags(matchDesc)
                // Calculate tag overlap (Jaccard similarity)
                const setA = new Set(originalTags)
                const setB = new Set(matchTags)
                const intersection = new Set([...setA].filter((x) => setB.has(x)))
                const union = new Set([...setA, ...setB])
                geminiScore = union.size > 0 ? intersection.size / union.size : 0
              }
            } catch (geminiError) {
              console.error("Gemini image understanding failed:", geminiError)
              geminiScore = null
            }

            // Blend Rekognition and Gemini scores if both are available
            if (geminiScore !== null) {
              matchConfidence = matchConfidence * 0.6 + geminiScore * 0.4
            }
          }
        } catch (error) {
          console.error("Error comparing images:", error)
          // If image comparison fails, fall back to metadata-based confidence
          matchConfidence = calculateMetadataConfidence(originalPet, match)
        }

        // 7. Convert shelter_pets record to PetMatch object
        return {
          id: match.id,
          imageUrl: match.image_url,
          petType: match.pet_type,
          breeds: match.breeds || [],
          colors: match.colors || [],
          size: match.size,
          age: match.age,
          gender: match.gender,
          name: match.name,
          description: match.description,
          distinctiveFeatures: match.distinctive_features || [],
          matchConfidence,
          foundDate: match.found_date,
          shelter: {
            id: match.shelter.id,
            name: match.shelter.name,
            address: `${match.shelter.address}, ${match.shelter.city}, ${match.shelter.state} ${match.shelter.zip}`,
            phone: match.shelter.phone,
            email: match.shelter.email,
            website: match.shelter.website,
            distance: match.distance,
            coordinates: match.shelter.coordinates,
          },
        }
      }),
    )

    // 8. Sort matches by confidence
    matches.sort((a, b) => b.matchConfidence - a.matchConfidence)

    // 9. Store the match results in the database for future reference
    await supabase.from("pet_match_results").insert({
      search_id: searchId,
      matches: matches.map((match) => ({
        pet_id: match.id,
        confidence: match.matchConfidence,
      })),
      timestamp: new Date().toISOString(),
    })

    return { originalPet, matches }
  } catch (error) {
    console.error("Error in getPetMatches:", error)

    // If there's an error, return a minimal result set to avoid breaking the UI
    // In a production app, you might want to throw the error and handle it at the UI level
    return {
      originalPet: {
        id: searchId,
        imageUrl: "/placeholder.svg?key=error",
        description: "Error retrieving pet details. Please try again.",
      },
      matches: [],
    }
  }
}

/**
 * Helper function to extract S3 key from a URL
 */
function getS3KeyFromUrl(url: string): string | null {
  try {
    // This assumes URLs in the format: https://bucket-name.s3.amazonaws.com/key
    // Adjust the regex as needed for your actual URL format
    const match = url.match(/https:\/\/[^/]+\.s3\.amazonaws\.com\/(.+)/)
    return match ? match[1] : null
  } catch (error) {
    console.error("Error extracting S3 key:", error)
    return null
  }
}

/**
 * Calculate confidence based on metadata matching
 * This is a fallback when image comparison fails
 */
function calculateMetadataConfidence(originalPet: Pet, match: any): number {
  let score = 0
  let totalFactors = 0

  // Pet type is a strong indicator
  if (originalPet.petType === match.pet_type) {
    score += 0.3
    totalFactors += 1
  }

  // Breed matching
  if (originalPet.breeds && originalPet.breeds.length > 0 && match.breeds && match.breeds.length > 0) {
    const breedOverlap = originalPet.breeds.filter((breed) => match.breeds.includes(breed)).length
    if (breedOverlap > 0) {
      score += 0.2 * (breedOverlap / Math.max(originalPet.breeds.length, match.breeds.length))
      totalFactors += 1
    }
  }

  // Color matching
  if (originalPet.colors && originalPet.colors.length > 0 && match.colors && match.colors.length > 0) {
    const colorOverlap = originalPet.colors.filter((color) => match.colors.includes(color)).length
    if (colorOverlap > 0) {
      score += 0.15 * (colorOverlap / Math.max(originalPet.colors.length, match.colors.length))
      totalFactors += 1
    }
  }

  // Size matching
  if (originalPet.size && match.size && originalPet.size === match.size) {
    score += 0.1
    totalFactors += 1
  }

  // Age matching
  if (originalPet.age && match.age && originalPet.age === match.age) {
    score += 0.1
    totalFactors += 1
  }

  // Gender matching
  if (originalPet.gender && match.gender && originalPet.gender === match.gender) {
    score += 0.15
    totalFactors += 1
  }

  // Distance factor - closer is better
  if (match.distance !== undefined) {
    // Exponential decay based on distance - pets within 5 miles get high scores
    const distanceFactor = Math.exp(-match.distance / 10)
    score += 0.2 * distanceFactor
    totalFactors += 1
  }

  // Normalize the score
  return totalFactors > 0 ? score / totalFactors : 0.5
}
