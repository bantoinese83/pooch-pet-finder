"use client"
import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapLoading } from "@/components/map-loading"
import { MapPin, Locate, Search, Flame } from "lucide-react"
import { useRouter } from "next/navigation"

const PET_TYPES = ["dog", "cat", "other"]
const REPORT_TYPES = ["lost", "found"]

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    petType: "",
    reportType: "",
    date: "",
    radius: 10000, // 10km
    heatmap: false,
  })
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 40.7128, lng: -74.006 })
  const [address, setAddress] = useState("")
  const [pets, setPets] = useState<any[]>([])
  const [shelters, setShelters] = useState<any[]>([])
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<any[]>([])
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)
  const router = useRouter()

  // Fetch pets and shelters
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const { data: pets } = await supabase.from("pet_reports").select("*")
      const { data: shelters } = await supabase.from("shelters").select("*")
      setPets(pets || [])
      setShelters(shelters || [])
      setIsLoading(false)
    }
    fetchData()
  }, [])

  // Real-time updates for pets and shelters
  useEffect(() => {
    const petSub = supabase
      .channel('realtime:pet_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pet_reports' }, payload => {
        setPets((prev) => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new]
          if (payload.eventType === 'UPDATE') return prev.map(p => p.id === payload.new.id ? payload.new : p)
          if (payload.eventType === 'DELETE') return prev.filter(p => p.id !== payload.old.id)
          return prev
        })
      })
      .subscribe()
    const shelterSub = supabase
      .channel('realtime:shelters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, payload => {
        setShelters((prev) => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new]
          if (payload.eventType === 'UPDATE') return prev.map(s => s.id === payload.new.id ? payload.new : s)
          if (payload.eventType === 'DELETE') return prev.filter(s => s.id !== payload.old.id)
          return prev
        })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(petSub)
      supabase.removeChannel(shelterSub)
    }
  }, [])

  // Initialize map and markers
  useEffect(() => {
    let isMounted = true
    let clusterer: any = null
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          version: "weekly",
          libraries: ["visualization", "marker", "places"],
        })
        await loader.load()
        if (!window.google || !window.google.maps) throw new Error("Google Maps failed to load")
        const { Map } = (await loader.importLibrary("maps")) as google.maps.MapsLibrary
        const map = new Map(mapRef.current!, {
          center,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })
        googleMapRef.current = map
        // Clear old markers
        markersRef.current.forEach((m) => m.setMap(null))
        markersRef.current = []
        // Add pet markers
        const filteredPets = pets.filter((pet) => {
          if (filters.petType && pet.pet_type !== filters.petType) return false
          if (filters.reportType && pet.report_type !== filters.reportType) return false
          if (filters.date && new Date(pet.created_at) < new Date(filters.date)) return false
          if (pet.coordinates) {
            const d = window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(center.lat, center.lng),
              new window.google.maps.LatLng(pet.coordinates.lat, pet.coordinates.lng)
            )
            if (d > filters.radius) return false
          }
          return true
        })
        const petMarkers = filteredPets.map((pet) => {
          if (!pet.coordinates) return null
          const marker = new window.google.maps.Marker({
            position: pet.coordinates,
            map,
            icon: pet.image_url ? {
              url: pet.image_url,
              scaledSize: new window.google.maps.Size(40, 40),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(20, 20),
              shape: { coords: [20, 20, 20], type: "circle" },
            } : {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: pet.report_type === "lost" ? "#ef4444" : "#22c55e",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
              scale: 8,
            },
            title: `${pet.pet_name || "Pet"} (${pet.report_type})`,
          })
          marker.addListener("click", () => router.push(`/pet/${pet.id}`))
          return marker
        }).filter(Boolean)
        // Add shelter markers
        const shelterMarkers = shelters.map((shelter) => {
          if (!shelter.coordinates) return null
          const marker = new window.google.maps.Marker({
            position: shelter.coordinates,
            map,
            icon: {
              url: "/shelter-icon.png",
              scaledSize: new window.google.maps.Size(36, 36),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(18, 18),
            },
            title: shelter.name,
          })
          marker.addListener("click", () => router.push(`/shelters/${shelter.id}`))
          return marker
        }).filter(Boolean)
        markersRef.current = [...petMarkers, ...shelterMarkers]
        // Add clustering
        if (window.MarkerClusterer) {
          clusterer = new window.MarkerClusterer({
            map,
            markers: markersRef.current,
          })
        }
        // Add heatmap
        if (filters.heatmap && window.google.maps.visualization) {
          const heatmapData = filteredPets.map((pet) =>
            new window.google.maps.LatLng(pet.coordinates.lat, pet.coordinates.lng)
          )
          heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            map,
            radius: 40,
            opacity: 0.5,
          })
        } else if (heatmapRef.current) {
          heatmapRef.current.setMap(null)
        }
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load map. Please try again later.")
        setIsLoading(false)
      }
    }
    if (!isLoading) initMap()
    return () => {
      isMounted = false
      if (clusterer) clusterer.clearMarkers()
      markersRef.current.forEach((m) => m.setMap(null))
      if (heatmapRef.current) heatmapRef.current.setMap(null)
    }
    // eslint-disable-next-line
  }, [isLoading, pets, shelters, filters, center])

  // Handle filter changes
  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }))
  }
  const handleHeatmapToggle = () => setFilters((f) => ({ ...f, heatmap: !f.heatmap }))
  const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => setFilters((f) => ({ ...f, radius: Number(e.target.value) }))
  // Geocode address to center map
  const handleSearch = async () => {
    if (!address) return
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
      const data = await res.json()
      if (data.results && data.results[0]) {
        setCenter({
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
        })
      }
    } catch {
      setError("Failed to find location.")
    }
  }
  return (
    <div className="max-w-6xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-bold text-amber-800 mb-4 text-center">Pet & Shelter Map</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-center justify-center">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address or city"
          className="w-64"
        />
        <Button onClick={handleSearch} className="bg-amber-600 hover:bg-amber-700"><Search className="h-4 w-4 mr-1" />Search</Button>
        <select name="petType" value={filters.petType} onChange={handleFilter} className="rounded-md border border-gray-300 text-sm p-2">
          <option value="">All Types</option>
          {PET_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select name="reportType" value={filters.reportType} onChange={handleFilter} className="rounded-md border border-gray-300 text-sm p-2">
          <option value="">Lost & Found</option>
          {REPORT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <input type="date" name="date" value={filters.date} onChange={handleFilter} className="rounded-md border border-gray-300 text-sm p-2" />
        <select value={filters.radius} onChange={handleRadiusChange} className="rounded-md border border-gray-300 text-sm p-2">
          <option value={1000}>1km</option>
          <option value={5000}>5km</option>
          <option value={10000}>10km</option>
          <option value={25000}>25km</option>
          <option value={50000}>50km</option>
        </select>
        <Button onClick={handleHeatmapToggle} variant={filters.heatmap ? "default" : "outline"} className="flex items-center gap-1">
          <Flame className="h-4 w-4" /> {filters.heatmap ? "Hide Heatmap" : "Show Heatmap"}
        </Button>
        <Button variant="outline" className="flex items-center gap-1" onClick={() => alert('Polygon search coming soon!')}>
          <MapPin className="h-4 w-4" /> Draw Area
        </Button>
      </div>
      <div className="w-full h-[600px] rounded-lg overflow-hidden border border-amber-200 relative">
        {isLoading && <div className="absolute inset-0 z-10"><MapLoading /></div>}
        {error && <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10"><div className="text-red-500 text-center p-4">{error}</div></div>}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  )
} 