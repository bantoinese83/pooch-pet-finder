import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { IndexFacesCommand, DetectLabelsCommand } from "@aws-sdk/client-rekognition"
import { v4 as uuidv4 } from "uuid"
import { s3Client, rekognitionClient, S3_BUCKET_NAME } from "@/lib/aws-config"
import { clientEnv } from "@/lib/env"
import { fileToBuffer } from "@/lib/file-utils"
import type { Attribute } from "@aws-sdk/client-rekognition"

// Initialize Supabase client
const supabase = createClient(clientEnv.SUPABASE_URL, clientEnv.SUPABASE_ANON_KEY)

// GET: Retrieve all pets or pets for a specific shelter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shelterId = searchParams.get("shelterId")
    const petId = searchParams.get("petId")
    const status = searchParams.get("status")

    // First, check if the shelters table exists
    const { data: sheltersCheck, error: sheltersCheckError } = await supabase.from("shelters").select("id").limit(1)

    if (sheltersCheckError) {
      console.error("Error checking shelters table:", sheltersCheckError)
      return NextResponse.json({ error: "Database schema issue: shelters table not accessible" }, { status: 500 })
    }

    // Then check if the shelter_pets table exists
    const petsCheckResponse = await supabase.from("shelter_pets").select("*").eq("shelter_id", shelterId)
    if (petsCheckResponse.error) {
      console.error("Error checking shelter_pets table:", petsCheckResponse.error)
      return NextResponse.json({ error: "Database schema issue: shelter_pets table not accessible" }, { status: 500 })
    }

    // Now perform the actual query with proper error handling for the join
    let query = supabase.from("shelter_pets").select("*")

    // Add shelter details if the shelters table exists and has data
    if (sheltersCheck && sheltersCheck.length > 0) {
      try {
        // Test if the join works with a simple query first
        const { error: joinTestError } = await supabase.from("shelter_pets").select("id, shelter_id").limit(1)

        if (!joinTestError) {
          // If the simple query works, try the join
          query = supabase.from("shelter_pets").select(`
            *,
            shelters:shelter_id(id, name, address, city, state, zip, phone, email, website)
          `)
        }
      } catch (joinError) {
        console.warn("Join between shelter_pets and shelters failed, falling back to basic query:", joinError)
        // Continue with the basic query without the join
      }
    }

    if (petId) {
      // Get a specific pet
      query = query.eq("id", petId).single()
    } else {
      // Apply filters
      if (shelterId) {
        query = query.eq("shelter_id", shelterId)
      }

      if (status) {
        query = query.eq("status", status)
      }

      // Order by most recently found
      query = query.order("found_date", { ascending: false })
    }

    const { data: pets, error } = await query

    if (error) {
      console.error("Error retrieving pets:", error)
      return NextResponse.json({ error: "Failed to retrieve pets: " + error.message }, { status: 500 })
    }

    return NextResponse.json(pets)
  } catch (error) {
    console.error("Error retrieving pets:", error)
    return NextResponse.json({ error: "Failed to retrieve pets: " + (error as Error).message }, { status: 500 })
  }
}

// POST: Add a new found pet
export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    // Get shelter ID and authentication token
    const shelterId = formData.get("shelterId") as string
    const authToken = formData.get("authToken") as string

    // In a real application, you would validate the shelter's auth token here
    // For now, we'll just check if the shelter exists
    const { data: shelter, error: shelterError } = await supabase
      .from("shelters")
      .select("id, status")
      .eq("id", shelterId)
      .single()

    if (shelterError || !shelter) {
      return NextResponse.json({ error: "Invalid shelter ID" }, { status: 401 })
    }

    if (shelter.status !== "active") {
      return NextResponse.json({ error: "Shelter account is not active" }, { status: 403 })
    }

    // Get pet details
    const image = formData.get("image") as File
    const petType = formData.get("petType") as string
    const breeds = JSON.parse((formData.get("breeds") as string) || "[]")
    const colors = JSON.parse((formData.get("colors") as string) || "[]")
    const size = formData.get("size") as string
    const age = formData.get("age") as string
    const gender = formData.get("gender") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const foundDate = formData.get("foundDate") as string
    const foundLocation = formData.get("foundLocation") as string
    const coordinates = formData.get("coordinates") ? JSON.parse(formData.get("coordinates") as string) : null
    const distinctiveFeatures = JSON.parse((formData.get("distinctiveFeatures") as string) || "[]")

    // Validate required fields
    if (!image || !petType) {
      return NextResponse.json({ error: "Image and pet type are required" }, { status: 400 })
    }

    // Generate a unique ID for this pet
    const petId = uuidv4()

    // Upload image to S3
    const buffer = await fileToBuffer(image)
    const s3Key = `shelter-pets/${shelterId}/${petId}/${image.name}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: image.type,
      }),
    )

    const imageUrl = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`

    // Process image with AWS Rekognition to extract features for matching
    // This would be used later for matching with lost pets
    try {
      // Index the face in the collection (if it's a clear face)
      const indexFacesParams = {
        CollectionId: "PetFaces", // You would need to create this collection first
        Image: {
          S3Object: {
            Bucket: S3_BUCKET_NAME,
            Name: s3Key,
          },
        },
        ExternalImageId: petId,
        DetectionAttributes: ["ALL" as Attribute],
      }

      try {
        await rekognitionClient.send(new IndexFacesCommand(indexFacesParams))
      } catch (faceError) {
        console.log("No faces detected or error indexing faces:", faceError)
        // This is expected for many pet photos, so we continue
      }

      // Detect labels (objects, scenes, concepts) in the image
      const detectLabelsParams = {
        Image: {
          S3Object: {
            Bucket: S3_BUCKET_NAME,
            Name: s3Key,
          },
        },
        MaxLabels: 50,
        MinConfidence: 70,
      }

      const labelsResponse = await rekognitionClient.send(new DetectLabelsCommand(detectLabelsParams))

      // Store the pet in the database
      const { data: pet, error } = await supabase
        .from("shelter_pets")
        .insert({
          id: petId,
          shelter_id: shelterId,
          image_url: imageUrl,
          s3_key: s3Key,
          pet_type: petType,
          breeds,
          colors,
          size,
          age,
          gender,
          name,
          description,
          found_date: foundDate || new Date().toISOString(),
          found_location: foundLocation,
          coordinates,
          distinctive_features: distinctiveFeatures,
          status: "available", // Pet is available for claiming
          rekognition_labels: labelsResponse.Labels || [],
        })
        .select()
        .single()

      if (error) {
        console.error("Error storing pet in database:", error)
        return NextResponse.json({ error: "Failed to store pet information: " + error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Pet added successfully",
        pet,
      })
    } catch (rekognitionError) {
      console.error("Error processing image with Rekognition:", rekognitionError)

      // Even if Rekognition fails, we still want to store the pet
      const { data: pet, error } = await supabase
        .from("shelter_pets")
        .insert({
          id: petId,
          shelter_id: shelterId,
          image_url: imageUrl,
          s3_key: s3Key,
          pet_type: petType,
          breeds,
          colors,
          size,
          age,
          gender,
          name,
          description,
          found_date: foundDate || new Date().toISOString(),
          found_location: foundLocation,
          coordinates,
          distinctive_features: distinctiveFeatures,
          status: "available", // Pet is available for claiming
        })
        .select()
        .single()

      if (error) {
        console.error("Error storing pet in database:", error)
        return NextResponse.json({ error: "Failed to store pet information: " + error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Pet added successfully (image processing failed)",
        pet,
      })
    }
  } catch (error) {
    console.error("Error adding pet:", error)
    return NextResponse.json({ error: "Failed to add pet: " + (error as Error).message }, { status: 500 })
  }
}

// PATCH: Update pet status (e.g., mark as claimed)
export async function PATCH(request: Request) {
  try {
    const { petId, status } = await request.json()
    if (!petId || !status) {
      return NextResponse.json({ error: "petId and status are required" }, { status: 400 })
    }
    const { data: pet, error } = await supabase
      .from("shelter_pets")
      .update({ status })
      .eq("id", petId)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, pet })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
