import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { S3Client } from "@aws-sdk/client-s3"
import { RekognitionClient } from "@aws-sdk/client-rekognition"

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

// GET: Retrieve all shelters or a specific shelter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shelterId = searchParams.get("id")

    if (shelterId) {
      // Get a specific shelter
      const { data: shelter, error } = await supabase.from("shelters").select("*").eq("id", shelterId).single()

      if (error) {
        return NextResponse.json({ error: "Shelter not found" }, { status: 404 })
      }

      return NextResponse.json(shelter)
    } else {
      // Get all shelters
      const { data: shelters, error } = await supabase.from("shelters").select("*").order("name", { ascending: true })

      if (error) {
        return NextResponse.json({ error: "Failed to retrieve shelters" }, { status: 500 })
      }

      return NextResponse.json(shelters)
    }
  } catch (error) {
    console.error("Error retrieving shelters:", error)
    return NextResponse.json({ error: "Failed to retrieve shelters" }, { status: 500 })
  }
}

// POST: Register a new shelter
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, city, state, zip, phone, email, website, description } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if shelter with this email already exists
    const { data: existingShelter } = await supabase.from("shelters").select("id").eq("email", email).single()

    if (existingShelter) {
      return NextResponse.json({ error: "A shelter with this email already exists" }, { status: 409 })
    }

    // Create new shelter
    const { data: shelter, error } = await supabase
      .from("shelters")
      .insert({
        name,
        address,
        city,
        state,
        zip,
        phone,
        email,
        website,
        description,
        status: "pending", // Shelters start as pending until verified
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating shelter:", error)
      return NextResponse.json({ error: "Failed to create shelter" }, { status: 500 })
    }

    // In a real application, you would send a verification email here

    return NextResponse.json({
      success: true,
      message: "Shelter registered successfully. Pending verification.",
      shelter,
    })
  } catch (error) {
    console.error("Error registering shelter:", error)
    return NextResponse.json({ error: "Failed to register shelter" }, { status: 500 })
  }
}

// PUT: Update shelter information
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Shelter ID is required" }, { status: 400 })
    }

    // Update shelter
    const { data: shelter, error } = await supabase.from("shelters").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating shelter:", error)
      return NextResponse.json({ error: "Failed to update shelter" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Shelter updated successfully",
      shelter,
    })
  } catch (error) {
    console.error("Error updating shelter:", error)
    return NextResponse.json({ error: "Failed to update shelter" }, { status: 500 })
  }
}
