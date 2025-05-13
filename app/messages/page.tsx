"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle } from "lucide-react"

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Fetch user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      setLoading(true)
      setAuthError(null)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      const res = await fetch("/api/messages", {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      if (res.status === 401) {
        setAuthError("You must be signed in to view your messages.")
        setLoading(false)
        return
      }
      try {
        const data = await res.json()
        setConversations(data.conversations || [])
      } catch {
        setAuthError("Failed to load messages.")
      }
      setLoading(false)
    }
    fetchConversations()
  }, [user])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selected) return
    async function fetchMessages() {
      setLoading(true)
      setAuthError(null)
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      const res = await fetch("/api/messages", {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
      if (res.status === 401) {
        setAuthError("You must be signed in to view your messages.")
        setLoading(false)
        return
      }
      // Fetch messages from supabase directly (client-side)
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", selected.conversation_id)
        .order("created_at", { ascending: true })
      setMessages(data || [])
      setLoading(false)
    }
    fetchMessages()
  }, [selected, user])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // User search effect
  useEffect(() => {
    if (!showDialog || !search.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    let active = true
    setSearchLoading(true)
    setSearchError(null)
    // Fetch users from Supabase (excluding self)
    supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
      .neq("id", user?.id)
      .limit(10)
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setSearchError("Failed to search users.")
          setSearchResults([])
        } else {
          setSearchResults(data || [])
        }
        setSearchLoading(false)
      })
    return () => { active = false }
  }, [search, showDialog, user])

  // Send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !selected) return
    setSending(true)
    setAuthError(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token
    await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ conversation_id: selected.conversation_id, content: newMessage })
    })
    setNewMessage("")
    setSending(false)
    // Refresh messages
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("conversation_id", selected.conversation_id)
      .order("created_at", { ascending: true })
    setMessages(data || [])
  }

  // Typing indicator (demo only)
  function handleTyping() {
    setTyping(true)
    setTimeout(() => setTyping(false), 1200)
  }

  // Start direct chat
  async function handleStartChat(targetUser: any) {
    setSearchLoading(true)
    setSearchError(null)
    // Get all conversation_ids for the target user
    const { data: targetConvs, error: targetConvsError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", targetUser.id)
    if (targetConvsError) {
      setSearchError("Failed to check existing conversations.")
      setSearchLoading(false)
      return
    }
    const targetConvIds = (targetConvs || []).map((c: any) => c.conversation_id)
    let conversationId = null
    if (targetConvIds.length > 0) {
      // Find a direct chat between the two users
      const { data: existing, error: existingError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations!inner(is_group)")
        .eq("user_id", user.id)
        .in("conversation_id", targetConvIds)
      if (existing && existing.length > 0) {
        const direct = existing.find((c: any) => !c.conversations.is_group)
        if (direct) conversationId = direct.conversation_id
      }
    }
    if (!conversationId) {
      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert([{ is_group: false }])
        .select()
        .single()
      if (convError || !conv) {
        setSearchError("Failed to create conversation.")
        setSearchLoading(false)
        return
      }
      conversationId = conv.id
      // Add both participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: targetUser.id },
      ])
    }
    // Refresh conversations and open the new one
    setShowDialog(false)
    setSearch("")
    setSearchResults([])
    setSearchLoading(false)
    // Refetch conversations
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token
    const res = await fetch("/api/messages", {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    })
    const data = await res.json()
    setConversations(data.conversations || [])
    // Find the new conversation
    const newConv = (data.conversations || []).find((c: any) => c.conversation_id === conversationId)
    if (newConv) setSelected(newConv)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-700">Loading messages...</div>
  if (authError || !user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-100 via-amber-50 to-white">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-amber-800 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">Please <a href="/login" className="text-amber-700 underline">sign in</a> to view your messages.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 py-10 px-2">
      <div className="max-w-5xl mx-auto rounded-2xl shadow-2xl border border-amber-100 bg-white/90 overflow-hidden flex flex-col" style={{ minHeight: 600 }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50/80 to-white">
          <MessageCircle className="h-7 w-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-amber-800 tracking-tight">Messages</h1>
        </div>
        <div className="flex flex-1 min-h-0">
          {/* Conversation List */}
          <aside className="w-1/3 border-r border-amber-100 bg-amber-50/60 p-0 flex flex-col">
            <div className="px-4 py-3 border-b border-amber-100 bg-white/80">
              <h2 className="text-lg font-semibold text-amber-700">Chats</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                </div>
              ) : (
                <ul className="space-y-2">
                  {conversations.map((c: any) => (
                    <li key={c.conversation_id}>
                      <Card
                        className={`p-3 cursor-pointer flex items-center gap-3 transition-all duration-150 hover:shadow-md hover:bg-amber-100/60 border border-transparent ${selected?.conversation_id === c.conversation_id ? 'bg-amber-100 border-amber-300 shadow' : ''}`}
                        onClick={() => setSelected(c)}
                      >
                        <Avatar className="h-10 w-10 shadow border border-amber-100" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-amber-900">{c.conversations?.name || 'Direct Chat'}</div>
                          <div className="text-xs text-gray-500 truncate">{c.conversations?.is_group ? 'Group' : 'Direct'}</div>
                        </div>
                        {c.conversations?.last_message_at && <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(c.conversations.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t border-amber-100 bg-white/80">
              <Button className="w-full" onClick={() => setShowDialog(true)}>New Message</Button>
            </div>
          </aside>
          {/* Divider */}
          <div className="w-px bg-amber-100" />
          {/* Chat Window */}
          <main className="flex-1 flex flex-col min-h-0">
            {selected ? (
              <>
                <div className="border-b border-amber-100 p-4 flex items-center gap-3 bg-white/80">
                  <Avatar className="h-10 w-10 shadow border border-amber-100" />
                  <div>
                    <div className="font-bold text-amber-900">{selected.conversations?.name || 'Direct Chat'}</div>
                    <div className="text-xs text-gray-500">{selected.conversations?.is_group ? 'Group' : 'Direct'}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-amber-50/60 via-white/80 to-yellow-50/60">
                  <AnimatePresence>
                    {messages.map((m: any, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`mb-3 flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs px-4 py-2 rounded-2xl shadow border ${m.sender_id === user?.id ? 'bg-amber-200 text-amber-900 border-amber-200' : 'bg-white text-gray-800 border-amber-100'} relative`}>
                          {m.content}
                          {/* Read receipt badge (demo) */}
                          {m.read && <Badge className="ml-2 bg-green-100 text-green-700">Read</Badge>}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {typing && <div className="text-xs text-gray-400 italic mb-2">Someone is typing...</div>}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="p-4 border-t border-amber-100 flex gap-2 bg-white/90">
                  <Input
                    value={newMessage}
                    onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border-amber-200 bg-amber-50/60 focus:ring-amber-400"
                    disabled={sending}
                    autoFocus
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()} className="rounded-full px-6">Send</Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-amber-400 text-xl bg-gradient-to-br from-amber-50/60 via-white/80 to-yellow-50/60">Select a conversation to start chatting</div>
            )}
          </main>
        </div>
        {/* New Message Dialog (for starting new chats) */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogTitle>Start a New Conversation</DialogTitle>
            <div className="p-4">
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mb-3"
                autoFocus
              />
              {searchLoading && <div className="text-amber-500 text-sm mb-2">Searching...</div>}
              {searchError && <div className="text-red-500 text-sm mb-2">{searchError}</div>}
              {search && !searchLoading && searchResults.length === 0 && !searchError && (
                <div className="text-gray-400 text-sm mb-2">No users found.</div>
              )}
              <ul className="space-y-2">
                {searchResults.map(u => (
                  <li key={u.id}>
                    <Card
                      className="p-3 flex items-center gap-3 cursor-pointer hover:bg-amber-100/60 border border-transparent hover:border-amber-200"
                      onClick={() => handleStartChat(u)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || "/placeholder-user.jpg"} alt={u.name || u.email || "User"} />
                        <AvatarFallback>{u.name?.[0] || u.email?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-amber-900">{u.name || u.email}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
              <Button className="mt-4 w-full" onClick={() => setShowDialog(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 