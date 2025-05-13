import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// GET: List conversations or messages for the authenticated user
export async function GET(request: Request) {
  // Get the user's access token from the Authorization header
  const authHeader = request.headers.get("authorization")
  let userId = null
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const accessToken = authHeader.replace("Bearer ", "")
    const { data: { user } } = await supabase.auth.getUser(accessToken)
    userId = user?.id || null
  }
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // List conversations for user
  const { data: conversations, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id, conversations(name, is_group, last_message_at, id)')
    .eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort conversations by last_message_at descending in JS
  const sorted = (conversations || []).sort((a, b) => {
    const getLastMessageAt = (c: any) => {
      if (!c.conversations) return 0
      if (Array.isArray(c.conversations)) {
        return c.conversations[0]?.last_message_at ? new Date(c.conversations[0].last_message_at).getTime() : 0
      }
      return c.conversations.last_message_at ? new Date(c.conversations.last_message_at).getTime() : 0
    }
    return getLastMessageAt(b) - getLastMessageAt(a)
  })

  return NextResponse.json({ conversations: sorted })
}

// POST: Send a message (requires conversation_id, content)
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  let userId = null
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const accessToken = authHeader.replace("Bearer ", "")
    const { data: { user } } = await supabase.auth.getUser(accessToken)
    userId = user?.id || null
  }
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const { conversation_id, content } = await request.json()
  if (!conversation_id || !content) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Insert message
  const { data: message, error } = await supabase
    .from('direct_messages')
    .insert({ conversation_id, sender_id: userId, content })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert message_recipients for all participants except sender
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversation_id)
    .neq('user_id', userId)
  if (participants && participants.length > 0) {
    await supabase.from('message_recipients').insert(
      participants.map((p: any) => ({ message_id: message.id, recipient_id: p.user_id }))
    )
  }

  return NextResponse.json({ message })
}

// PATCH: Mark message as read
export async function PATCH(request: Request) {
  const authHeader = request.headers.get("authorization")
  let userId = null
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const accessToken = authHeader.replace("Bearer ", "")
    const { data: { user } } = await supabase.auth.getUser(accessToken)
    userId = user?.id || null
  }
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const { message_id } = await request.json()
  if (!message_id) return NextResponse.json({ error: 'Missing message_id' }, { status: 400 })
  const { error } = await supabase
    .from('message_recipients')
    .update({ read: true })
    .eq('message_id', message_id)
    .eq('recipient_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 