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
    const finderName = formData.get("finderName") as string
    const finderPhone = formData.get("finderPhone") as string
    const finderEmail = formData.get("finderEmail") as string

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const reportId = uuidv4()
    const arrayBuffer = await image.arrayBuffer()
    const fileExt = image.name.split('.').pop()
    const filePath = `found-pets/${reportId}/${Date.now()}.${fileExt}`
    await supabase.storage.from("pet-images").upload(filePath, arrayBuffer, {
      contentType: image.type,
      upsert: true,
    })
    const { data: publicUrlData } = supabase.storage.from("pet-images").getPublicUrl(filePath)
    const imageUrl = publicUrlData?.publicUrl

    const { error } = await supabase.from("pet_reports").insert({
      id: reportId,
      report_type: "found",
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
      finder_name: finderName,
      finder_phone: finderPhone,
      finder_email: finderEmail,
      status: "active",
      created_at: new Date().toISOString(),
    })
    if (error) {
      console.error("Error storing found pet report in Supabase:", error)
      return NextResponse.json({ error: "Failed to store found pet report" }, { status: 500 })
    }
    // Optionally: search for matches, etc.
    return NextResponse.json({ reportId })
  } catch (error) {
    console.error("Error processing found pet report:", error)
    return NextResponse.json({ error: "Failed to process found pet report" }, { status: 500 })
  }
}
