import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { S3Client } from "@aws-sdk/client-s3"
import { RekognitionClient, SearchFacesByImageCommand, DetectLabelsCommand } from "@aws-sdk/client-rekognition"
import { calculateDistance } from "@/lib/map-utils"

// Initialize AWS clients
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

// POST: Find matches for a lost pet
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { searchId, s3Key, petType, breeds, colors, size, age, gender, coordinates, radius = 50 } = body

    if (!searchId || !s3Key) {
      return NextResponse.json({ error: "Search ID and S3 key are required" }, { status: 400 })
    }

    // Get all available shelter pets that match the basic criteria
    let query = supabase
      .from("shelter_pets")
      .select(`
        *,
        shelter:shelters(id, name, address, city, state, zip, phone, email, website, coordinates)
      `)
      .eq("status", "available")

    // Apply filters
    if (petType) {
      query = query.eq("pet_type", petType)
    }

    // Get the results
    const { data: potentialMatches, error } = await query

    if (error) {
      console.error("Error retrieving potential matches:", error)
      return NextResponse.json({ error: "Failed to retrieve potential matches" }, { status: 500 })
    }

    // Filter matches by additional criteria
    let filteredMatches = potentialMatches

    // Filter by breeds if specified
    if (breeds && breeds.length > 0) {
      filteredMatches = filteredMatches.filter((match) => {
        if (!match.breeds || match.breeds.length === 0) return false
        return breeds.some((breed: string) => match.breeds.includes(breed))
      })
    }

    // Filter by colors if specified
    if (colors && colors.length > 0) {
      filteredMatches = filteredMatches.filter((match) => {
        if (!match.colors || match.colors.length === 0) return false
        return colors.some((color: string) => match.colors.includes(color))
      })
    }

    // Filter by size if specified
    if (size) {
      filteredMatches = filteredMatches.filter((match) => match.size === size)
    }

    // Filter by age if specified
    if (age) {
      filteredMatches = filteredMatches.filter((match) => match.age === age)
    }

    // Filter by gender if specified
    if (gender) {
      filteredMatches = filteredMatches.filter((match) => match.gender === gender)
    }

    // Filter by distance if coordinates are provided
    if (coordinates && coordinates.lat && coordinates.lng) {
      filteredMatches = filteredMatches.filter((match) => {
        // Skip if shelter doesn't have coordinates
        if (!match.shelter.coordinates || !match.shelter.coordinates.lat || !match.shelter.coordinates.lng) {
          return true // Include matches without coordinates
        }

        const distance = calculateDistance(
          coordinates.lat,
          coordinates.lng,
          match.shelter.coordinates.lat,
          match.shelter.coordinates.lng,
        )

        // Add distance to the match object
        match.distance = distance

        // Include if within radius
        return distance <= radius
      })
    }

    // Now use AWS Rekognition to compare the lost pet image with potential matches
    // This is a more advanced step and would be computationally expensive for many images
    // In a real application, you might want to do this as a background job

    try {
      // First, try to search for faces in the collection
      const searchFacesParams = {
        CollectionId: "PetFaces",
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: s3Key,
          },
        },
        MaxFaces: 10,
        FaceMatchThreshold: 70,
      }

      try {
        const faceSearchResponse = await rekognitionClient.send(new SearchFacesByImageCommand(searchFacesParams))

        if (faceSearchResponse.FaceMatches && faceSearchResponse.FaceMatches.length > 0) {
          // We found face matches, use these to prioritize results
          const faceMatchIds = faceSearchResponse.FaceMatches.map((match) => match.Face?.ExternalImageId)

          // Boost the confidence of matches that have face matches
          filteredMatches = filteredMatches.map((match) => {
            if (faceMatchIds.includes(match.id)) {
              const faceMatch = faceSearchResponse.FaceMatches?.find((fm) => fm.Face?.ExternalImageId === match.id)
              match.matchConfidence = (faceMatch?.Similarity || 0) / 100
            } else {
              match.matchConfidence = 0.5 // Default confidence for non-face matches
            }
            return match
          })
        }
      } catch (faceError) {
        console.log("No faces found in the search image or error searching faces:", faceError)
        // This is expected for many pet photos, so we continue
      }

      // Detect labels in the lost pet image
      const detectLabelsParams = {
        Image: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: s3Key,
          },
        },
        MaxLabels: 50,
        MinConfidence: 70,
      }

      const labelsResponse = await rekognitionClient.send(new DetectLabelsCommand(detectLabelsParams))

      // Calculate label similarity for each potential match
      filteredMatches = filteredMatches.map((match) => {
        if (!match.rekognition_labels) {
          // If no labels, use existing confidence or default
          match.matchConfidence = match.matchConfidence || 0.5
          return match
        }

        // Calculate similarity based on common labels
        const lostPetLabels = labelsResponse.Labels || []
        const shelterPetLabels = match.rekognition_labels

        const lostPetLabelMap = new Map(lostPetLabels.map((label) => [label.Name, label.Confidence]))
        const shelterPetLabelMap = new Map(shelterPetLabels.map((label) => [label.Name, label.Confidence]))

        let totalScore = 0
        let matchCount = 0

        // Calculate similarity based on common labels and their confidence scores
        for (const [labelName, lostPetConfidence] of lostPetLabelMap.entries()) {
          if (shelterPetLabelMap.has(labelName)) {
            const shelterPetConfidence = shelterPetLabelMap.get(labelName) || 0
            // Weight the score by the average confidence
            const weightedScore = ((lostPetConfidence || 0) + (shelterPetConfidence || 0)) / 2 / 100
            totalScore += weightedScore
            matchCount++
          }
        }

        // Normalize the score
        const labelSimilarity = matchCount > 0 ? totalScore / matchCount : 0

        // Combine with existing confidence if available
        match.matchConfidence = match.matchConfidence
          ? match.matchConfidence * 0.7 + labelSimilarity * 0.3 // Weight face matches more heavily
          : labelSimilarity

        return match
      })

      // Sort by match confidence
      filteredMatches.sort((a, b) => (b.matchConfidence || 0) - (a.matchConfidence || 0))

      // Store the match results in the database
      await supabase.from("pet_match_results").insert({
        search_id: searchId,
        matches: filteredMatches.map((match) => ({
          pet_id: match.id,
          confidence: match.matchConfidence || 0,
        })),
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        matches: filteredMatches,
      })
    } catch (rekognitionError) {
      console.error("Error processing image with Rekognition:", rekognitionError)

      // Even if Rekognition fails, return the filtered matches with default confidence
      filteredMatches = filteredMatches.map((match) => {
        match.matchConfidence = 0.5 // Default confidence
        return match
      })

      return NextResponse.json({
        success: true,
        matches: filteredMatches,
        warning: "Image processing failed, matches may be less accurate",
      })
    }
  } catch (error) {
    console.error("Error finding matches:", error)
    return NextResponse.json({ error: "Failed to find matches" }, { status: 500 })
  }
}
