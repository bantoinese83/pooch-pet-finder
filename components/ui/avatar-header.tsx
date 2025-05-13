import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Mail } from "lucide-react"
import React from "react"

interface AvatarHeaderProps {
  name: string
  email: string
  avatarUrl?: string
  children?: React.ReactNode
  className?: string
}

export function AvatarHeader({ name, email, avatarUrl, children, className = "" }: AvatarHeaderProps) {
  return (
    <div className={"flex flex-col md:flex-row items-center gap-6 " + className}>
      <Avatar className="h-24 w-24 border-4 border-amber-200 shadow-lg">
        <AvatarImage src={avatarUrl || "/placeholder-user.jpg"} alt={name || email} />
        <AvatarFallback>{name?.[0] || email?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 flex flex-col gap-2 items-center md:items-start">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-800 flex items-center gap-2">
          {name}
        </h1>
        <div className="flex items-center gap-2 text-gray-600">
          <Mail className="h-4 w-4 text-amber-600" />
          <span>{email}</span>
        </div>
        {children}
      </div>
    </div>
  )
} 