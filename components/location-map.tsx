"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Loader, LoaderStatus } from "@googlemaps/js-api-loader"
import { MapPin, Locate, Search, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapLoading } from "@/components/map-loading"

// --- Constants ---
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID // Optional Map ID for styling/features

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 } // Default to New York City
const DEFAULT_ZOOM = 12
const DEFAULT_SEARCH_RADIUS_METERS = 1000 // 1km

// Type definitions for clarity
type MapStatus = "idle" | "loading" | "ready" | "error"
type GmsMarker = google.maps.Marker | google.maps.marker.AdvancedMarkerElement

interface LocationData {
  address: string
  lat: number
  lng: number
}

interface LocationMapProps {
  onLocationSelect: (location: LocationData) => void
  initialAddress?: string
}

// Declare google variable (remains the same)
declare global {
  interface Window {
    google: typeof google
  }
}

// --- Component ---
export const LocationMap = React.memo(({
  onLocationSelect,
  initialAddress = "",
}: LocationMapProps) => {
  // --- State ---
  const [mapStatus, setMapStatus] = useState<MapStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState(initialAddress)
  const [searchInputValue, setSearchInputValue] = useState(initialAddress) // Separate state for input value
  const [coordinates, setCoordinates] = useState<google.maps.LatLngLiteral | null>(null)
  const [searchRadius, setSearchRadius] = useState(DEFAULT_SEARCH_RADIUS_METERS)
  const [showMyLocationButton, setShowMyLocationButton] = useState(false)

  // --- Refs ---
  const mapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<GmsMarker | null>(null)
  const radiusCircleRef = useRef<google.maps.Circle | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([])
  const isAdvancedMarkerUsed = useRef<boolean>(false); // Track which marker type is actually used


  // --- Memoized Values ---
  const mapOptions = useMemo((): google.maps.MapOptions => {
    const options: google.maps.MapOptions = {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: true,
      streetViewControl: true, // Keep street view
      fullscreenControl: true, // Keep fullscreen
      clickableIcons: false, // Disable clicking default POIs
    }
    if (MAP_ID) {
      options.mapId = MAP_ID
      // Styles are applied via Cloud Console when using Map ID
    } else {
      // Basic style adjustments if no Map ID
      options.styles = [
        { featureType: "poi.business", stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      ]
    }
    return options
  }, []) // No dependencies, calculated once

  // --- Callbacks ---

  // Update marker position (handling both marker types)
  const updateMarkerPosition = useCallback((position: google.maps.LatLngLiteral | null) => {
    if (!markerRef.current || !position) return

    if (isAdvancedMarkerUsed.current) {
      (markerRef.current as google.maps.marker.AdvancedMarkerElement).position = position
    } else {
      (markerRef.current as google.maps.Marker).setPosition(position)
    }
  }, []) // No dependencies, relies on refs

  // Update radius circle
  const updateRadiusCircle = useCallback((center: google.maps.LatLngLiteral | null, radius: number) => {
    if (radiusCircleRef.current) {
      if (center) {
        radiusCircleRef.current.setCenter(center)
        radiusCircleRef.current.setRadius(radius)
        radiusCircleRef.current.setVisible(true)
      } else {
        radiusCircleRef.current.setVisible(false)
      }
    }
  }, []) // No dependencies, relies on ref

  // Reverse geocode coordinates to get address
  const geocodePosition = useCallback(async (position: google.maps.LatLngLiteral) => {
    if (!geocoderRef.current) {
      console.warn("Geocoder not initialized")
      return
    }

    try {
      const response = await geocoderRef.current.geocode({ location: position })
      if (response.results && response.results.length > 0) {
        const bestResult = response.results[0]
        const newAddress = bestResult.formatted_address || ""
        setAddress(newAddress)
        setSearchInputValue(newAddress) // Sync input field
        onLocationSelect({ address: newAddress, ...position })
      } else {
        console.warn("Reverse geocoding returned no results.")
        setAddress("Address not found") // Indicate no address found
      }
      setError(null) // Clear previous errors on success
    } catch (err) {
      console.error("Reverse geocoding error:", err)
      setError("Could not fetch address for the selected location.")
      // Keep the coordinates, but show an error for the address part
      setAddress("Error fetching address")
    }
  }, [onLocationSelect]) // Dependency: onLocationSelect prop

  // Geocode address string to get coordinates
  const geocodeAddress = useCallback(async (addressToGeocode: string) => {
    if (!addressToGeocode || !geocoderRef.current) {
      console.warn("Geocoder not initialized or address empty")
      return
    }
    setError(null) // Clear previous errors

    try {
      const response = await geocoderRef.current.geocode({ address: addressToGeocode })
      if (response.results && response.results.length > 0) {
        const location = response.results[0].geometry.location
        const newCoords = { lat: location.lat(), lng: location.lng() }
        const formattedAddress = response.results[0].formatted_address || addressToGeocode

        setCoordinates(newCoords)
        setAddress(formattedAddress)
        setSearchInputValue(formattedAddress) // Sync input

        if (googleMapRef.current) {
          googleMapRef.current.setCenter(newCoords)
          googleMapRef.current.setZoom(15) // Zoom in closer on search result
        }
        updateMarkerPosition(newCoords)
        updateRadiusCircle(newCoords, searchRadius)

        onLocationSelect({ address: formattedAddress, ...newCoords })
      } else {
        setError(`Location "${addressToGeocode}" not found. Please try a different address.`)
      }
    } catch (err: any) {
      console.error("Geocoding error:", err)
      // Handle specific geocoding errors if needed (e.g., ZERO_RESULTS, OVER_QUERY_LIMIT)
      if (err.code === google.maps.GeocoderStatus.ZERO_RESULTS) {
        setError(`Location "${addressToGeocode}" not found. Please try a different address.`)
      } else {
         setError("Error finding location. Please check the address or try again later.")
      }
    }
  }, [onLocationSelect, updateMarkerPosition, updateRadiusCircle, searchRadius]) // Dependencies


  // Handle map click event
  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newCoords = { lat: event.latLng.lat(), lng: event.latLng.lng() }
      setCoordinates(newCoords)
      updateMarkerPosition(newCoords)
      updateRadiusCircle(newCoords, searchRadius)
      geocodePosition(newCoords) // Get address for the clicked point
      setError(null) // Clear error on valid interaction
    }
  }, [geocodePosition, updateMarkerPosition, updateRadiusCircle, searchRadius])


  // Handle marker drag end event
  const handleMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
    const marker = markerRef.current;
    if (!marker) return;

    if (isAdvancedMarkerUsed.current) {
      // AdvancedMarkerElement: marker.position is LatLngLiteral | LatLng
      const pos = (marker as google.maps.marker.AdvancedMarkerElement).position;
      let lat: number | undefined, lng: number | undefined;
      if (pos) {
        if (typeof (pos as google.maps.LatLng).lat === 'function') {
          lat = (pos as google.maps.LatLng).lat();
          lng = (pos as google.maps.LatLng).lng();
        } else {
          lat = (pos as google.maps.LatLngLiteral).lat;
          lng = (pos as google.maps.LatLngLiteral).lng;
        }
      }
      if (lat !== undefined && lng !== undefined) {
        const newCoords = { lat, lng };
        setCoordinates(newCoords);
        updateRadiusCircle(newCoords, searchRadius);
        geocodePosition(newCoords); // Get address for the dragged point
        setError(null); // Clear error
      } else {
        console.error("Failed to get marker position after drag.");
        setError("Could not update marker position.");
      }
    } else {
      // Standard Marker: use getPosition()
      const pos = (marker as google.maps.Marker).getPosition();
      if (pos) {
        const lat = pos.lat();
        const lng = pos.lng();
        const newCoords = { lat, lng };
        setCoordinates(newCoords);
        updateRadiusCircle(newCoords, searchRadius);
        geocodePosition(newCoords); // Get address for the dragged point
        setError(null); // Clear error
      } else {
        console.error("Failed to get marker position after drag.");
        setError("Could not update marker position.");
      }
    }
  }, [geocodePosition, updateRadiusCircle, searchRadius]);


  // Handle place changed event from Autocomplete
  const handlePlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) return

    const place = autocompleteRef.current.getPlace()
    if (!place.geometry || !place.geometry.location) {
      // If geometry is missing, try geocoding the name/address fallback
      if(place.formatted_address || place.name) {
         geocodeAddress(place.formatted_address || place.name || "")
      } else {
        setError("Invalid place selected. Please try searching again.")
        console.warn("Autocomplete place has no geometry:", place)
      }
      return
    }

    const newCoords = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    }
    const newAddress = place.formatted_address || ""

    setCoordinates(newCoords)
    setAddress(newAddress)
    setSearchInputValue(newAddress) // Sync input

    if (googleMapRef.current) {
      googleMapRef.current.setCenter(newCoords)
      googleMapRef.current.setZoom(15)
    }
    updateMarkerPosition(newCoords)
    updateRadiusCircle(newCoords, searchRadius)
    onLocationSelect({ address: newAddress, ...newCoords })
    setError(null) // Clear error
  }, [onLocationSelect, geocodeAddress, updateMarkerPosition, updateRadiusCircle, searchRadius])

  // Handle manual search button click
  const handleSearchClick = useCallback(() => {
    if (searchInputValue) {
      geocodeAddress(searchInputValue)
    }
  }, [searchInputValue, geocodeAddress])

  // Handle Enter key in search input
  const handleSearchKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault() // Prevent form submission if applicable
      handleSearchClick()
    }
  }, [handleSearchClick])

  // Handle "Use My Location" button click
  const handleMyLocationClick = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      return
    }
    setError(null)
    // Consider adding a temporary loading state specific to geolocation
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
        updateMarkerPosition(newCoords)
        updateRadiusCircle(newCoords, searchRadius)
        geocodePosition(newCoords) // Get address for current location
      },
      (err) => {
        console.error("Geolocation error:", err)
        let message = "Unable to retrieve your location."
        if (err.code === err.PERMISSION_DENIED) {
          message += " Please ensure location services are enabled and permission is granted."
        } else if (err.code === err.POSITION_UNAVAILABLE) {
           message += " Location information is unavailable."
        } else if (err.code === err.TIMEOUT) {
            message += " The request to get user location timed out."
        }
        setError(message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options
    )
  }, [geocodePosition, updateMarkerPosition, updateRadiusCircle, searchRadius])

  // Handle radius dropdown change
  const handleRadiusChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRadius = Number(event.target.value)
    setSearchRadius(newRadius)
    // Update circle immediately if coordinates exist
    if (coordinates && radiusCircleRef.current) {
        radiusCircleRef.current.setRadius(newRadius)
    }
  }, [coordinates]) // Dependency: coordinates (to update existing circle)


  // --- Effects ---

  // Main Initialization Effect (Runs once on mount)
  useEffect(() => {
    let isMounted = true // Flag to prevent state updates on unmounted component
    let loader: Loader | null = null; // Keep loader instance for potential cleanup if needed

    const loadMap = async () => {
        setMapStatus("loading")
        setError(null)

        if (!API_KEY) {
            setError("Google Maps API Key is missing. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.")
            setMapStatus("error")
            return;
        }

        if (!mapRef.current || !searchInputRef.current) {
            setError("Map container or search input element not found in the DOM.")
            setMapStatus("error")
            return;
        }

        // Store refs in local variables for use within this async function
        const currentMapRef = mapRef.current;
        const currentSearchInputRef = searchInputRef.current;

        try {
            loader = new Loader({
                apiKey: API_KEY,
                version: "weekly",
                libraries: ["places", "marker", "geometry"], // Include necessary libraries
                mapIds: MAP_ID ? [MAP_ID] : undefined, // Conditionally include mapId
            });

            // Load core Maps library first
            await loader.importLibrary("maps")
            if (!isMounted) return; // Check mount status after async operation

            // Use window.google.maps for constructors
            if (!window.google?.maps?.Map || !window.google.maps.Geocoder || !window.google.maps.Circle) {
                throw new Error("Core Google Maps libraries failed to load.");
            }

            // Initialize Geocoder
            geocoderRef.current = new window.google.maps.Geocoder();

            // Initialize Map
            const map = new window.google.maps.Map(currentMapRef, mapOptions);
            googleMapRef.current = map;

            // Check if Advanced Markers library loaded successfully (best effort)
            await loader.importLibrary("marker");
            let AdvancedMarkerElement: typeof window.google.maps.marker.AdvancedMarkerElement | null = null;
            try {
                AdvancedMarkerElement = window.google.maps.marker.AdvancedMarkerElement;
            } catch (markerError) {
                console.warn("Advanced Markers library failed to load, falling back to standard markers.", markerError);
            }

            // Determine if we *can* use Advanced Markers
            const canUseAdvanced = !!(AdvancedMarkerElement && MAP_ID); // Require Map ID for Advanced Markers
            isAdvancedMarkerUsed.current = canUseAdvanced;

            // Create Marker
            let marker: GmsMarker;
            const initialPosition = coordinates ?? mapOptions.center; // Use state coords if available, else default

             if (canUseAdvanced && AdvancedMarkerElement) {
                // Use PinElement for a styled pin (no SvgIconElement)
                const pinGlyph = new window.google.maps.marker.PinElement({
                    background: "#D97706", // Amber background
                    borderColor: "#B45309", // Darker amber border
                    scale: 1.5, // Make the pin larger
                });

                marker = new AdvancedMarkerElement({
                    position: initialPosition,
                    map: map,
                    content: pinGlyph.element, // Use PinElement for better styling
                    title: "Pet Location (drag to adjust)",
                    gmpDraggable: true,
                });
            } else {
                 // Fallback to standard marker
                marker = new window.google.maps.Marker({
                    position: initialPosition,
                    map: map,
                    draggable: true,
                    title: "Pet Location (drag to adjust)",
                    icon: { // Basic custom icon for standard marker
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#D97706",
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: "#FFFFFF",
                    },
                });
            }
            markerRef.current = marker;


            // Initialize Radius Circle
            radiusCircleRef.current = new window.google.maps.Circle({
                strokeColor: "#d97706", // Amber
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#d97706", // Amber
                fillOpacity: 0.15,
                map: map,
                center: initialPosition,
                radius: searchRadius,
                visible: !!coordinates, // Only visible if we have coordinates initially
            });

            // --- Load Places Library & Setup Autocomplete ---
            await loader.importLibrary("places")
            if (!isMounted) return;

            if (!window.google.maps.places?.Autocomplete) {
                 throw new Error("Google Places Autocomplete library failed to load.");
            }

            autocompleteRef.current = new window.google.maps.places.Autocomplete(currentSearchInputRef, {
                fields: ["address_components", "geometry", "name", "formatted_address"],
                types: ["address"], // Restrict to addresses for better accuracy
            });


            // --- Attach Event Listeners ---
            mapListenersRef.current.push(
                map.addListener("click", handleMapClick),
                marker.addListener('dragend', handleMarkerDragEnd), // Use consistent naming if possible, works for both types
                autocompleteRef.current.addListener("place_changed", handlePlaceChanged)
            );


            // --- Final Setup ---
            setShowMyLocationButton(!!navigator.geolocation); // Check geolocation support

            // Geocode initial address if provided *after* map is ready
            if (initialAddress) {
                 await geocodeAddress(initialAddress); // Await ensures it finishes before setting ready
            } else if (coordinates) {
                // If initial coords were somehow set (e.g. parent state), update map
                map.setCenter(coordinates);
                map.setZoom(15);
                updateMarkerPosition(coordinates);
                updateRadiusCircle(coordinates, searchRadius);
                // Optionally reverse geocode initial coords if needed
                // await geocodePosition(coordinates);
            }

            if (isMounted) {
                setMapStatus("ready");
            }

        } catch (err: any) {
            console.error("Google Maps loading/initialization error:", err);
            if (isMounted) {
                setError(err?.message || "Failed to load Google Maps. Please check configuration and network.");
                setMapStatus("error");
            }
        }
    }

    loadMap();

    // --- Cleanup Function ---
    return () => {
        isMounted = false;
        console.log("Cleaning up LocationMap...")

        // Remove all registered listeners
        mapListenersRef.current.forEach((listener) => listener.remove());
        mapListenersRef.current = [];

        // Clean up Google Maps objects
        if (markerRef.current) {
             if (isAdvancedMarkerUsed.current) {
                 (markerRef.current as google.maps.marker.AdvancedMarkerElement).map = null;
             } else {
                 (markerRef.current as google.maps.Marker).setMap(null);
             }
             markerRef.current = null;
        }
        if (radiusCircleRef.current) {
            radiusCircleRef.current.setMap(null);
            radiusCircleRef.current = null;
        }
        if (autocompleteRef.current) {
            // Remove listeners attached directly via google.maps.event
            // Note: `autocomplete.addListener` returns an object we stored, removing it is enough
             window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
             // Also try to remove the input binding if possible (though usually handled by GC)
            const pacContainers = document.querySelectorAll('.pac-container');
            pacContainers.forEach(container => container.remove()); // Remove dropdown suggestions UI
            autocompleteRef.current = null;
        }
        if (googleMapRef.current) {
            window.google.maps.event.clearInstanceListeners(googleMapRef.current);
            // Map instance itself doesn't have a destroy method, relies on GC
            googleMapRef.current = null;
        }
        geocoderRef.current = null;

        // Reset state if needed, though unmounting usually handles this
        // setMapStatus("idle");
        // setError(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // IMPORTANT: Empty dependency array ensures this runs only once on mount

  // --- Effect to update circle/marker when coordinates change externally or via state ---
  useEffect(() => {
    // Only run if map is ready and coordinates are valid
    if (mapStatus === "ready" && coordinates) {
        updateMarkerPosition(coordinates);
        updateRadiusCircle(coordinates, searchRadius);
        // Optional: Center map if coordinates change significantly? Decide based on UX.
        // googleMapRef.current?.panTo(coordinates);
    }
  }, [coordinates, mapStatus, searchRadius, updateMarkerPosition, updateRadiusCircle]); // Re-run if coords, radius or status changes


  // --- Render Logic ---
  return (
    <div className="space-y-4">
      {/* Search Input and Buttons */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Input
            ref={searchInputRef}
            value={searchInputValue} // Controlled by separate state
            onChange={(e) => setSearchInputValue(e.target.value)} // Update input state directly
            onKeyDown={handleSearchKeyPress}
            placeholder="Enter location or drop a pin"
            className="pl-10 pr-4 py-2 border rounded-md w-full"
            aria-label="Search for location"
            disabled={mapStatus !== 'ready'} // Disable input until map is ready
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            type="button"
            onClick={handleSearchClick}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md flex items-center"
            disabled={mapStatus !== 'ready' || !searchInputValue} // Disable if map not ready or input empty
          >
            <MapPin className="h-4 w-4 mr-2" />
            Search
          </Button>
          {showMyLocationButton && (
            <Button
              type="button"
              variant="outline"
              onClick={handleMyLocationClick}
              className="border-amber-500 text-amber-700 hover:bg-amber-50 px-3 py-2 rounded-md flex items-center"
              title="Use my current location"
              disabled={mapStatus !== 'ready'} // Disable until map is ready
              aria-label="Use my current location"
            >
              <Locate className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 p-3 rounded-md text-sm">
           <AlertTriangle className="h-5 w-5 flex-shrink-0" />
           <span>{error}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full h-[300px] md:h-[400px] rounded-md overflow-hidden border border-gray-200 relative bg-gray-100">
        {(mapStatus === "loading" || mapStatus === "idle") && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <MapLoading message={mapStatus === "loading" ? "Loading Map..." : "Initializing..."} />
          </div>
        )}
         {mapStatus === "error" && !error && ( // Show generic error if state is error but message is null
             <div className="absolute inset-0 z-10 flex items-center justify-center text-red-500 p-4 text-center">
                Map failed to load. Please try refreshing the page.
             </div>
         )}
        <div
            ref={mapRef}
            className={`w-full h-full transition-opacity duration-300 ${mapStatus === 'ready' ? 'opacity-100' : 'opacity-0'}`} // Fade in map when ready
            aria-label="Location selection map"
            role="application"
        />
      </div>

      {/* Controls Below Map */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Radius Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="search-radius" className="text-sm text-gray-600 shrink-0">
             Search Radius:
          </label>
          <select
            id="search-radius"
            value={searchRadius}
            onChange={handleRadiusChange}
            className="rounded-md border border-gray-300 text-sm p-1 bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            disabled={mapStatus !== 'ready'} // Disable until map is ready
          >
            <option value="500">500m</option>
            <option value="1000">1km</option>
            <option value="2000">2km</option>
            <option value="5000">5km</option>
            <option value="10000">10km</option>
          </select>
        </div>

        {/* Instructions */}
        <p className="text-xs text-gray-500 text-right flex-1 min-w-0">
          {mapStatus === 'ready'
            ? "Click map or drag marker pinpoints the last seen location."
            : "Map is loading..."}
        </p>
      </div>
    </div>
  )
})

// Add display name for better debugging
LocationMap.displayName = "LocationMap"