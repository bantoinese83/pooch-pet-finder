// PATCH: Update pet report status (e.g., mark as claimed)
export async function PATCH(request: Request) {
  try {
    const { petId, status, reward_paid } = await request.json()
    if (!petId) {
      return NextResponse.json({ error: "petId is required" }, { status: 400 })
    }
    const updateFields: any = {}
    if (status) updateFields.status = status
    if (typeof reward_paid === 'boolean') updateFields.reward_paid = reward_paid
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }
    const { data: pet, error } = await supabase
      .from("pet_reports")
      .update(updateFields)
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