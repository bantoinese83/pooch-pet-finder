"use client"

import { useState, useEffect, useRef } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import type { PetMatch } from "@/lib/types"
import { MapLoading } from "@/components/map-loading"
import { Button } from "@/components/ui/button"
import { MapPin, ZoomIn, ZoomOut, Locate } from "lucide-react"
import { motion } from "framer-motion"

interface PetMatchMapProps {
  matches: PetMatch[]
  originalPet: {
    coordinates?: {
      lat: number
      lng: number
    }
  }
  onMarkerClick?: (matchId: string) => void
}

export function PetMatchMap({ matches, originalPet, onMarkerClick }: PetMatchMapProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<{ [key: string]: google.maps.Marker | google.maps.marker.AdvancedMarkerElement }>({})
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([])
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false)
  const [mapZoom, setMapZoom] = useState(11)
  const [useAdvancedMarkers, setUseAdvancedMarkers] = useState(false)

  // Add a function to center the map on the original pet location
  const centerOnOriginalLocation = () => {
    if (googleMapRef.current && originalPet.coordinates) {
      googleMapRef.current.setCenter(originalPet.coordinates)
      googleMapRef.current.setZoom(14)
      setMapZoom(14)
    }
  }

  // Add zoom controls
  const zoomIn = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 11
      googleMapRef.current.setZoom(currentZoom + 1)
      setMapZoom(currentZoom + 1)
    }
  }

  const zoomOut = () => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() || 11
      googleMapRef.current.setZoom(currentZoom - 1)
      setMapZoom(currentZoom - 1)
    }
  }

  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      try {
        // Update the Loader initialization to use the environment variable
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          version: "weekly",
          libraries: ["marker"],
          mapIds: [process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || ""],
        })

        const { Map, InfoWindow, Marker } = (await loader.importLibrary("maps")) as google.maps.MapsLibrary

        // Check if we can use Advanced Markers (requires a valid Map ID)
        let AdvancedMarkerElement
        try {
          const markerLib = (await loader.importLibrary("marker")) as google.maps.MarkerLibrary
          AdvancedMarkerElement = markerLib.AdvancedMarkerElement
          setUseAdvancedMarkers(!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID)
        } catch {
          console.warn("Advanced markers not available, falling back to standard markers")
          setUseAdvancedMarkers(false)
        }

        if (!isMounted) return

        setGoogleMapsLoaded(true)

        if (!mapRef.current) return

        // Default to New York City coordinates if no original pet coordinates
        const defaultLocation = originalPet.coordinates || { lat: 40.7128, lng: -74.006 }

        const mapOptions: google.maps.MapOptions = {
          center: defaultLocation,
          zoom: mapZoom,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false, // We'll add custom zoom controls
          fullscreenControl: false,
          gestureHandling: "greedy", // Better for mobile
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }

        // Add mapId only if it's available
        if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID) {
          mapOptions.mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID
        }

        const map = new Map(mapRef.current, mapOptions)

        googleMapRef.current = map
        infoWindowRef.current = new InfoWindow()

        // Add marker for original pet location
        if (originalPet.coordinates) {
          if (useAdvancedMarkers && AdvancedMarkerElement) {
            // Create a pin element for the original pet location
            const pinElement = document.createElement("div")
            pinElement.innerHTML = `
              <div style="
                width: 20px;
                height: 20px;
                background-color: #f59e0b;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              "></div>
            `

            const originalMarker = new AdvancedMarkerElement({
              position: originalPet.coordinates,
              map,
              content: pinElement,
              title: "Last Seen Location",
              zIndex: 1000,
            })

            // Add click listener to the original marker
            originalMarker.addEventListener("click", () => {
              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                  <div style="padding: 8px; max-width: 200px;">
                    <strong style="color: #92400e;">Last Seen Location</strong>
                    <p style="margin: 4px 0 0; font-size: 12px;">This is where your pet was last seen</p>
                  </div>
                `)
                infoWindowRef.current.open(map, originalMarker)
              }
            })
          } else {
            // Use standard marker as fallback
            const originalMarker = new Marker({
              position: originalPet.coordinates,
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#f59e0b",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 8,
              },
              title: "Last Seen Location",
              zIndex: 1000,
            })

            // Add click listener to the original marker
            originalMarker.addListener("click", () => {
              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                  <div style="padding: 8px; max-width: 200px;">
                    <strong style="color: #92400e;">Last Seen Location</strong>
                    <p style="margin: 4px 0 0; font-size: 12px;">This is where your pet was last seen</p>
                  </div>
                `)
                infoWindowRef.current.open(map, originalMarker)
              }
            })
          }
        }

        // Add markers for all matches with animation delay
        matches.forEach((match, index) => {
          if (match.shelter.coordinates) {
            setTimeout(() => {
              if (!isMounted) return

              if (useAdvancedMarkers && AdvancedMarkerElement) {
                // Create a marker element with percentage label
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
                    ">${Math.round(match.matchConfidence * 100)}%</div>
                  </div>
                `

                const marker = new AdvancedMarkerElement({
                  position: match.shelter.coordinates,
                  map,
                  content: markerElement,
                  title: match.shelter.name,
                })

                markersRef.current[match.id] = marker

                // Add click listener to the marker
                marker.addEventListener("click", () => {
                  if (infoWindowRef.current) {
                    infoWindowRef.current.setContent(`
                      <div style="padding: 8px; max-width: 200px;">
                        <strong style="color: #92400e;">${match.name || "Unknown"}</strong>
                        <p style="margin: 4px 0 0; font-size: 12px;">${match.shelter.name}</p>
                        <p style="margin: 4px 0 0; font-size: 12px; color: #d97706;">${Math.round(match.matchConfidence * 100)}% Match</p>
                      </div>
                    `)
                    infoWindowRef.current.open(map, marker)

                    if (onMarkerClick) {
                      onMarkerClick(match.id)
                    }
                  }
                })
              } else {
                // Use standard marker as fallback
                const marker = new Marker({
                  position: match.shelter.coordinates,
                  map,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: "#d97706",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    scale: 10,
                  },
                  label: {
                    text: `${Math.round(match.matchConfidence * 100)}%`,
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: "bold",
                  },
                  title: match.shelter.name,
                })

                markersRef.current[match.id] = marker

                // Add click listener to the marker
                marker.addListener("click", () => {
                  if (infoWindowRef.current) {
                    infoWindowRef.current.setContent(`
                      <div style="padding: 8px; max-width: 200px;">
                        <strong style="color: #92400e;">${match.name || "Unknown"}</strong>
                        <p style="margin: 4px 0 0; font-size: 12px;">${match.shelter.name}</p>
                        <p style="margin: 4px 0 0; font-size: 12px; color: #d97706;">${Math.round(match.matchConfidence * 100)}% Match</p>
                      </div>
                    `)
                    infoWindowRef.current.open(map, marker)

                    if (onMarkerClick) {
                      onMarkerClick(match.id)
                    }
                  }
                })
              }
            }, index * 100) // Stagger marker animations
          }
        })

        // Fit bounds to include all markers
        const bounds = new google.maps.LatLngBounds()

        if (originalPet.coordinates) {
          bounds.extend(originalPet.coordinates)
        }

        matches.forEach((match) => {
          if (match.shelter.coordinates) {
            bounds.extend(match.shelter.coordinates)
          }
        })

        map.fitBounds(bounds)

        // Don't zoom in too far
        const idleListener = google.maps.event.addListener(map, "idle", () => {
          if (map.getZoom() > 15) {
            map.setZoom(15)
            setMapZoom(15)
          }
          google.maps.event.removeListener(idleListener)
        })

        // Update zoom state when map zoom changes
        const zoomListener = googleMapRef.current.addListener("zoom_changed", () => {
          setMapZoom(googleMapRef.current.getZoom() || 11)
        })

        mapListenersRef.current.push(zoomListener)

        if (isMounted) {
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Error loading Google Maps:", err)
        if (isMounted) {
          setError("Failed to load map. Please try again later.")
          setIsLoading(false)
        }
      }
    }

    initMap()

    return () => {
      isMounted = false

      // Clean up event listeners
      const listeners = mapListenersRef.current
      listeners.forEach((listener) => {
        if (google && google.maps) {
          google.maps.event.removeListener(listener)
        }
      })

      // Clear markers
      Object.values(markersRef.current).forEach((marker) => {
        if (marker) {
          // @ts-expect-error: marker may be either google.maps.Marker or AdvancedMarkerElement, both have .map
          marker.map = null
        }
      })

      // Clear info window
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }

      // Clear references
      markersRef.current = {}
      googleMapRef.current = null
      infoWindowRef.current = null
    }
  }, [matches, originalPet, onMarkerClick, mapZoom, useAdvancedMarkers])

  // Highlight marker when selected
  const highlightMarker = (matchId: string) => {
    if (!googleMapsLoaded) return

    const marker = markersRef.current[matchId]
    if (marker && googleMapRef.current) {
      if (useAdvancedMarkers) {
        // Create a bounce effect by scaling the marker
        const content = (marker as google.maps.marker.AdvancedMarkerElement).content as HTMLElement
        if (content) {
          content.style.transition = "transform 0.3s ease-in-out"
          content.style.transform = "scale(1.3)"

          setTimeout(() => {
            content.style.transform = "scale(1)"
          }, 300)
        }
      } else {
        // For standard markers, we can use a bounce animation
        ;(marker as google.maps.Marker).setAnimation(google.maps.Animation.BOUNCE)
        setTimeout(() => {
          ;(marker as google.maps.Marker).setAnimation(null)
        }, 700)
      }

      // Pan to the marker
      googleMapRef.current.panTo(marker.position as google.maps.LatLng)
    }
  }

  // Expose the highlightMarker function
  useEffect(() => {
    if (window && googleMapsLoaded) {
      ;(window as unknown as { highlightMarker?: typeof highlightMarker }).highlightMarker = highlightMarker
    }

    return () => {
      if (window) {
        delete (window as unknown as { highlightMarker?: typeof highlightMarker }).highlightMarker
      }
    }
  }, [googleMapsLoaded, highlightMarker])

  return (
    <div className="w-full h-[500px] md:h-[600px] rounded-lg overflow-hidden border border-amber-200 relative">
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <MapLoading />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-red-500 text-center p-4">{error}</div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {originalPet.coordinates && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-md"
              onClick={centerOnOriginalLocation}
            >
              <MapPin className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Last Seen</span>
            </Button>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="outline"
            className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 shadow-md h-8 w-8"
            onClick={zoomIn}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="outline"
            className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 shadow-md h-8 w-8"
            onClick={zoomOut}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </motion.div>
        {originalPet.coordinates && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="outline"
              className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50 shadow-md h-8 w-8"
              onClick={centerOnOriginalLocation}
              aria-label="Center on last seen location"
            >
              <Locate className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>

      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
