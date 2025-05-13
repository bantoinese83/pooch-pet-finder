import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { name, contactName, email, phone, address, city, state, zip, website, description } = await request.json()
    const { error } = await supabase.from("shelters").insert({
      name,
      contact_name: contactName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      website,
      description,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to submit shelter registration" }, { status: 500 })
  }
} 