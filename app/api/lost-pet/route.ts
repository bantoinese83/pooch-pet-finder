import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

function arraysIntersect(a, b) {
  return a.some(item => b.includes(item))
}

function haversineDistance(coord1, coord2) {
  if (!coord1 || !coord2) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: Request) {
  try {
    // Get the user's access token from the Authorization header
    const authHeader = request.headers.get("authorization")
    let userId = null
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.replace("Bearer ", "")
      const { data: { user } } = await supabase.auth.getUser(accessToken)
      userId = user?.id || null
    }
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to report a lost pet." }, { status: 401 })
    }
    const formData = await request.formData()
    const image = formData.get("image") as File
    if (!image) {
      return NextResponse.json({ error: "Please upload a photo of your pet." }, { status: 400 })
    }
    const petType = formData.get("petType") as string
    const petName = (formData.get("petName") as string) || null
    const breeds = JSON.parse((formData.get("breeds") as string) || "[]")
    const colors = JSON.parse((formData.get("colors") as string) || "[]")
    const distinctiveFeatures = JSON.parse((formData.get("distinctiveFeatures") as string) || "[]")
    const size = formData.get("size") as string
    const age = formData.get("age") as string
    const gender = formData.get("gender") as string
    const location = formData.get("location") as string
    const coordinates = formData.get("coordinates") ? JSON.parse(formData.get("coordinates") as string) : null
    const description = formData.get("description") as string
    const lastSeenDate = (formData.get("lastSeenDate") as string) || new Date().toISOString().split("T")[0]

    const searchId = uuidv4()
    const arrayBuffer = await image.arrayBuffer()
    const fileExt = image.name.split('.').pop()
    const filePath = `lost-pets/${searchId}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from("pet-images").upload(filePath, arrayBuffer, {
      contentType: image.type,
      upsert: true,
    })
    if (uploadError) {
      return NextResponse.json({
        error: "Image upload failed. Please check your file type and size, or try again later.",
        details: uploadError.message || null
      }, { status: 500 })
    }
    const { data: publicUrlData } = supabase.storage.from("pet-images").getPublicUrl(filePath)
    const imageUrl = publicUrlData?.publicUrl

    const { error: insertError } = await supabase.from("pet_reports").insert({
      id: searchId,
      report_type: "lost",
      image_url: imageUrl,
      s3_key: filePath,
      pet_name: petName,
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
      last_seen_date: lastSeenDate,
      status: "active",
      created_at: new Date().toISOString(),
      user_id: userId,
    }).select().single()
    if (insertError) {
      let userMessage = "Failed to save your report. Please try again."
      if (insertError.message && insertError.message.includes("row-level security policy")) {
        userMessage = "You are not authorized to submit this report. Please sign in and try again."
      }
      return NextResponse.json({
        error: userMessage,
        details: insertError.message || null
      }, { status: 500 })
    }

    // Automated matching: find found pets with similar type, color, breed
    const { data: foundPets } = await supabase
      .from("pet_reports")
      .select("id, user_id, pet_type, breeds, colors, location, status")
      .eq("report_type", "found")
      .eq("status", "active")
      .eq("pet_type", petType)

    const matches = []
    for (const pet of foundPets || []) {
      let score = 0
      // Breed match
      if (arraysIntersect(breeds, pet.breeds || [])) score += 0.3
      // Color match
      if (arraysIntersect(colors, pet.colors || [])) score += 0.3
      // Location proximity (within 25km)
      let close = false
      if (coordinates && pet.coordinates) {
        const dist = haversineDistance(coordinates, pet.coordinates)
        if (dist !== null && dist <= 25) {
          score += 0.2
          close = true
        }
      }
      // Date proximity (within 14 days)
      let dateClose = false
      if (pet.day_found && lastSeenDate) {
        const lostDate = new Date(lastSeenDate)
        const foundDate = new Date(pet.day_found)
        const diffDays = Math.abs((foundDate - lostDate) / (1000 * 60 * 60 * 24))
        if (diffDays <= 14) {
          score += 0.2
          dateClose = true
        }
      }
      // Only match if score >= 0.5
      if (score >= 0.5) {
        await supabase.from("pet_match_history").insert({
          lost_pet_id: searchId,
          found_pet_id: pet.id,
          match_confidence: score,
        })
        if (userId) {
          await supabase.from("notifications").insert({
            user_id: userId,
            type: "match",
            message: "A potential match was found for your lost pet!",
          })
        }
        if (pet.user_id) {
          await supabase.from("notifications").insert({
            user_id: pet.user_id,
            type: "match",
            message: "A potential match was found for your found pet!",
          })
        }
        matches.push(pet.id)
      }
    }

    return NextResponse.json({ searchId, matches })
  } catch (error) {
    console.error("Error processing lost pet report:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again later.", details: error?.message || null }, { status: 500 })
  }
}
