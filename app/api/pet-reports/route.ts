// PATCH: Update pet report status (e.g., mark as claimed)
export async function PATCH(request: Request) {
  try {
    const { petId, status } = await request.json()
    if (!petId || !status) {
      return NextResponse.json({ error: "petId and status are required" }, { status: 400 })
    }
    const { data: pet, error } = await supabase
      .from("pet_reports")
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