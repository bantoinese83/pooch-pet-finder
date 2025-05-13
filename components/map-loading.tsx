import { Loader2 } from "lucide-react"

interface MapLoadingProps {
  message?: string
}

export function MapLoading({ message = "Loading map..." }: MapLoadingProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
      <Loader2 className="h-8 w-8 text-amber-600 animate-spin mb-2" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )
}
