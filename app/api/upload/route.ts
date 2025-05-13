import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const petType = formData.get("petType") as string
    const breeds = JSON.parse((formData.get("breeds") as string) || "[]")
    const colors = JSON.parse((formData.get("colors") as string) || "[]")
    const distinctiveFeatures = JSON.parse((formData.get("distinctiveFeatures") as string) || "[]")
    const size = formData.get("size") as string
    const age = formData.get("age") as string
    const gender = formData.get("gender") as string
    const location = formData.get("location") as string
    const coordinates = formData.get("coordinates") ? JSON.parse(formData.get("coordinates") as string) : null
    const description = formData.get("description") as string
    const dayFound = (formData.get("dayFound") as string) || new Date().toISOString().split("T")[0]

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const searchId = uuidv4()
    const arrayBuffer = await image.arrayBuffer()
    const fileExt = image.name.split('.').pop()
    const filePath = `lost-pets/${searchId}/${Date.now()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabase.storage.from("pet-images").upload(filePath, arrayBuffer, {
      contentType: image.type,
      upsert: true,
    })
    if (uploadError) {
      console.error("Error uploading image to Supabase Storage:", uploadError)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }
    const { data: publicUrlData } = supabase.storage.from("pet-images").getPublicUrl(filePath)
    const imageUrl = publicUrlData?.publicUrl

    const { error } = await supabase.from("pet_searches").insert({
      id: searchId,
      image_url: imageUrl,
      s3_key: filePath,
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
      day_found: dayFound,
      status: "processing",
      created_at: new Date().toISOString(),
    })
    if (error) {
      console.error("Error storing search in Supabase:", error)
      return NextResponse.json({ error: "Failed to store search" }, { status: 500 })
    }
    await supabase.from("pet_searches").update({ status: "completed" }).eq("id", searchId)
    return NextResponse.json({ searchId })
  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}
