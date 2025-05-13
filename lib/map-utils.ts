export function getGoogleMapsStaticImageUrl(lat: number, lng: number, zoom = 14, width = 400, height = 200): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
}

export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    return "Less than 0.1 miles"
  } else if (distance < 1) {
    return `${(distance * 10).toFixed(0) / 10} miles`
  } else {
    return `${distance.toFixed(1)} miles`
  }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula to calculate distance between two points
  const R = 3958.8 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
