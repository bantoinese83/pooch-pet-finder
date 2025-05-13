"use client"

import React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { MapPin, Locate, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapLoading } from "@/components/map-loading"

interface LocationMapProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void
  initialAddress?: string
}

// Declare google variable
declare global {
  interface Window {
    google: typeof google
  }
}

export function LocationMap({ onLocationSelect, initialAddress = "" }: LocationMapProps) {
  const [address, setAddress] = useState(initialAddress)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null>(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([])
  const [showMyLocationButton, setShowMyLocationButton] = useState(false)
  const [radiusCircle, setRadiusCircle] = useState<google.maps.Circle | null>(null)
  const [searchRadius, setSearchRadius] = useState(1000) // 1km default radius
  const [useAdvancedMarkers, setUseAdvancedMarkers] = useState(false)

  // Memoize map options to avoid recreating on every render
  const mapOptions = React.useMemo(() => {
    const defaultLocation = { lat: 40.7128, lng: -74.006 }
    const options: google.maps.MapOptions = {
      center: defaultLocation,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    }
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID) {
      options.mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID
      // Do NOT set styles if mapId is present
    } else {
      options.styles = [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "transit",
          elementType: "labels.icon",
          stylers: [{ visibility: "off" }],
        },
      ]
    }
    return options
  }, [])

  // Move these hooks above the main useEffect
  const updateMarker = useCallback((position: { lat: number; lng: number }) => {
    if (markerRef.current) {
      if (useAdvancedMarkers) {
        // For AdvancedMarkerElement
        ;(markerRef.current as google.maps.marker.AdvancedMarkerElement).position = position
      } else {
        // For standard Marker
        ;(markerRef.current as google.maps.Marker).setPosition(position)
      }
    }
  }, [useAdvancedMarkers])

  const updateRadiusCircle = useCallback((center: { lat: number; lng: number }) => {
    if (radiusCircle) {
      radiusCircle.setCenter(center)
      radiusCircle.setVisible(true)
    }
  }, [radiusCircle])

  const geocodeAddress = useCallback(
    async (addressToGeocode: string) => {
      if (!addressToGeocode || !geocoderRef.current || !googleMapsLoaded) return

      try {
        const result = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
          geocoderRef.current?.geocode({ address: addressToGeocode }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve({ results } as google.maps.GeocoderResponse)
            } else {
              reject(new Error(`Geocoding failed: ${status}`))
            }
          })
        })

        if (result.results.length > 0) {
          const location = result.results[0].geometry.location
          const newCoords = { lat: location.lat(), lng: location.lng() }

          setCoordinates(newCoords)
          setAddress(result.results[0].formatted_address || "")

          if (googleMapRef.current) {
            googleMapRef.current.setCenter(newCoords)
            googleMapRef.current.setZoom(15)
          }

          updateMarker(newCoords)
          updateRadiusCircle(newCoords)

          onLocationSelect({
            address: result.results[0].formatted_address || "",
            ...newCoords,
          })
        } else {
          setError("Location not found. Please try a different address.")
        }
      } catch (err) {
        console.error("Geocoding error:", err)
        setError("Error finding location. Please try a different address.")
      }
    },
    [onLocationSelect, googleMapsLoaded, updateMarker, updateRadiusCircle],
  )

  // Load Google Maps API
  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          version: "weekly",
          libraries: ["places", "marker", "geometry"],
          mapIds: [process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || ""],
        })

        // Load the Google Maps script first
        await loader.load()

        // Defensive check: Ensure google and DOM refs exist
        if (!window.google || !window.google.maps) {
          setError("Google Maps failed to load. Please check your API key and quota.")
          return
        }
        if (!mapRef.current || !searchInputRef.current) {
          setError("Map container not available. Please reload the page.")
          return
        }

        // Import required libraries
        const { Map } = (await loader.importLibrary("maps")) as google.maps.MapsLibrary
        const { Autocomplete } = (await loader.importLibrary("places")) as google.maps.PlacesLibrary

        // Create Geocoder directly from google.maps namespace
        const geocoder = new window.google.maps.Geocoder()

        // Check if we can use Advanced Markers (requires a valid Map ID)
        let AdvancedMarkerElement
        try {
          const markerLib = (await loader.importLibrary("marker")) as google.maps.MarkerLibrary
          AdvancedMarkerElement = markerLib.AdvancedMarkerElement
          setUseAdvancedMarkers(!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID)
        } catch (e) {
          console.warn("Advanced markers not available, falling back to standard markers")
          setUseAdvancedMarkers(false)
        }

        if (!isMounted) return

        setGoogleMapsLoaded(true)
        geocoderRef.current = geocoder

        // Check again after async for DOM refs
        if (!mapRef.current || !searchInputRef.current) {
          setError("Map container not available. Please reload the page.")
          return
        }

        // Check if geolocation is available
        setShowMyLocationButton(!!navigator.geolocation)

        // Use memoized mapOptions
        const map = new Map(mapRef.current, mapOptions)

        googleMapRef.current = map

        // Defensive: Ensure Autocomplete constructor exists
        // TODO: Migrate to PlaceAutocompleteElement before March 2025 (see Google Maps migration guide)
        if (typeof Autocomplete !== "function") {
          setError("Google Maps Autocomplete failed to load. Please check your API key and quota.")
          return
        }

        // Initialize Places Autocomplete
        const autocomplete = new Autocomplete(searchInputRef.current, {
          fields: ["address_components", "geometry", "name", "formatted_address"],
        })

        autocompleteRef.current = autocomplete

        // Add event listener for place selection
        const placeChangedListener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()

          if (!place.geometry || !place.geometry.location) {
            setError("No location details available for this place. Please try another.")
            return
          }

          const newCoords = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }

          setCoordinates(newCoords)
          setAddress(place.formatted_address || "")

          // Update map and marker
          if (googleMapRef.current) {
            googleMapRef.current.setCenter(newCoords)
            googleMapRef.current.setZoom(15)
          }

          updateMarker(newCoords)
          updateRadiusCircle(newCoords)

          // Notify parent component
          onLocationSelect({
            address: place.formatted_address || "",
            ...newCoords,
          })
        })

        mapListenersRef.current.push(placeChangedListener)

        // Defensive: Only create marker if map is available
        if (!googleMapRef.current) {
          setError("Map failed to initialize. Please reload the page.")
          return
        }

        // Create a marker based on available features
        if (useAdvancedMarkers && AdvancedMarkerElement) {
          // Create an advanced marker
          const markerElement = document.createElement("div")
          markerElement.innerHTML = `
            <div style="
              position: relative;
              width: 30px;
              height: 40px;
            ">
              <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 30px;
                height: 30px;
                background-color: #d97706;
                border-radius: 50% 50% 0 50%;
                transform: rotate(45deg);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              "></div>
              <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
                font-weight: bold;
              ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
            </div>
          `

          const marker = new AdvancedMarkerElement({
            position: mapOptions.center,
            map,
            content: markerElement,
            title: "Pet Location",
          })

          markerRef.current = marker
        } else {
          // Use standard marker as fallback
          if (!window.google.maps.Marker) {
            setError("Google Maps Marker failed to load. Please check your API key and quota.")
            return
          }
          const marker = new window.google.maps.Marker({
            position: mapOptions.center,
            map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: "#d97706",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 10,
            },
            title: "Pet Location",
            draggable: true,
          })

          // Add drag end listener for standard marker
          marker.addListener("dragend", () => {
            const position = marker.getPosition()
            if (position) {
              const newCoords = { lat: position.lat(), lng: position.lng() }
              setCoordinates(newCoords)
              updateRadiusCircle(newCoords)
              geocodePosition(newCoords)
            }
          })

          markerRef.current = marker
        }

        // Create radius circle
        if (!window.google.maps.Circle) {
          setError("Google Maps Circle failed to load. Please check your API key and quota.")
          return
        }
        const circle = new window.google.maps.Circle({
          strokeColor: "#d97706",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#d97706",
          fillOpacity: 0.1,
          map,
          center: mapOptions.center,
          radius: searchRadius,
          visible: false,
        })

        setRadiusCircle(circle)

        // Add event listener for map click
        const clickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            const newCoords = { lat: event.latLng.lat(), lng: event.latLng.lng() }
            setCoordinates(newCoords)
            updateMarker(newCoords)
            updateRadiusCircle(newCoords)
            geocodePosition(newCoords)
          }
        })

        mapListenersRef.current.push(clickListener)

        // If we have an initial address, geocode it
        if (initialAddress) {
          geocodeAddress(initialAddress)
        }

        setIsLoading(false)
      } catch (err: any) {
        console.error("Error loading Google Maps:", err)
        if (isMounted) {
          setError(err?.message || "Failed to load Google Maps. Please try again later.")
          setIsLoading(false)
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
      // Clean up event listeners
      mapListenersRef.current.forEach((listener) => {
        if (window.google && window.google.maps) {
          window.google.maps.event.removeListener(listener)
        }
      })

      // Clear references
      if (markerRef.current) {
        if (useAdvancedMarkers) {
          // For AdvancedMarkerElement
          ;(markerRef.current as google.maps.marker.AdvancedMarkerElement).map = null
        } else {
          // For standard Marker
          ;(markerRef.current as google.maps.Marker).setMap(null)
        }
      }

      if (radiusCircle) {
        radiusCircle.setMap(null)
      }

      googleMapRef.current = null
      autocompleteRef.current = null
    }
  }, [initialAddress, onLocationSelect, searchRadius, useAdvancedMarkers, mapOptions, geocodeAddress])

  // Geocode coordinates to address
  const geocodePosition = useCallback(
    async (position: { lat: number; lng: number }) => {
      if (!geocoderRef.current || !googleMapsLoaded) return

      try {
        const result = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
          geocoderRef.current?.geocode({ location: position }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve({ results } as google.maps.GeocoderResponse)
            } else {
              reject(new Error(`Reverse geocoding failed: ${status}`))
            }
          })
        })

        if (result.results.length > 0) {
          const newAddress = result.results[0].formatted_address || ""
          setAddress(newAddress)

          onLocationSelect({
            address: newAddress,
            ...position,
          })
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err)
      }
    },
    [onLocationSelect, googleMapsLoaded],
  )

  // Handle search button click
  const handleSearch = () => {
    if (address) {
      geocodeAddress(address)
    }
  }

  // Handle enter key press in input
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSearch()
    }
  }

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          setCoordinates(newCoords)

          if (googleMapRef.current) {
            googleMapRef.current.setCenter(newCoords)
            googleMapRef.current.setZoom(15)
          }

          updateMarker(newCoords)
          updateRadiusCircle(newCoords)
          geocodePosition(newCoords)
        },
        (err) => {
          console.error("Geolocation error:", err)
          setError("Unable to get your current location. Please try entering an address.")
        },
      )
    }
  }

  // Handle radius change
  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius)
    if (radiusCircle) {
      radiusCircle.setRadius(newRadius)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Input
            ref={searchInputRef}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter location where pet was last seen"
            onKeyDown={handleKeyPress}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={handleSearch} className="bg-amber-600 hover:bg-amber-700 flex-shrink-0">
            <MapPin className="h-4 w-4 mr-2" />
            Search
          </Button>

          {showMyLocationButton && (
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 flex-shrink-0"
              title="Use my current location"
            >
              <Locate className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="w-full h-[300px] rounded-md overflow-hidden border border-gray-200 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10">
            <MapLoading />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Search radius:</span>
          <select
            value={searchRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="rounded-md border border-gray-300 text-sm p-1"
          >
            <option value="500">500m</option>
            <option value="1000">1km</option>
            <option value="2000">2km</option>
            <option value="5000">5km</option>
            <option value="10000">10km</option>
          </select>
        </div>

        <p className="text-xs text-gray-500 flex-1">
          Click on the map or drag the marker to pinpoint the exact location where your pet was last seen.
        </p>
      </div>
    </div>
  )
}
