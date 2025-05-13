import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"

// Initialize AWS clients
const s3Client = new S3Client({
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const petType = formData.get("petType") as string

    // Parse JSON strings back to arrays
    const breeds = JSON.parse((formData.get("breeds") as string) || "[]")
    const colors = JSON.parse((formData.get("colors") as string) || "[]")
    const distinctiveFeatures = JSON.parse((formData.get("distinctiveFeatures") as string) || "[]")

    // Get other fields
    const size = formData.get("size") as string
    const age = formData.get("age") as string
    const gender = formData.get("gender") as string
    const location = formData.get("location") as string
    const coordinates = formData.get("coordinates") ? JSON.parse(formData.get("coordinates") as string) : null
    const description = formData.get("description") as string

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Generate a unique ID for this search
    const searchId = uuidv4()

    // Convert the file to a buffer
    const buffer = Buffer.from(await image.arrayBuffer())

    // Upload to S3
    const s3Key = `lost-pets/${searchId}/${image.name}`
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: image.type,
      }),
    )

    const imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`

    // Store the search in Supabase
    const { error } = await supabase.from("pet_reports").insert({
      id: searchId,
      image_url: imageUrl,
      s3_key: s3Key,
      pet_type: petType,
      breeds,
      colors,
      size,
      age,
      gender,
      location,
      coordinates,
      description,
      distinctive_features: distinctiveFeatures,
      status: "processing",
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error storing search in Supabase:", error)
      return NextResponse.json({ error: "Failed to store search" }, { status: 500 })
    }

    // Update the status to "completed" after processing
    await supabase.from("pet_reports").update({ status: "completed" }).eq("id", searchId)

    return NextResponse.json({ searchId })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}
