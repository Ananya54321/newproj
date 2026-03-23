/**
 * Geographic utilities:
 *  - Haversine distance calculation
 *  - Nominatim geocoding (OpenStreetMap, free, no API key)
 *  - Browser Geolocation API wrapper
 */

export interface LatLng {
  lat: number
  lng: number
}

/** Returns distance in kilometres between two lat/lng points using Haversine formula. */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(h))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Formats a distance in km as a human-readable string. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

// Nominatim rate limit: 1 request per second.
// We cache results in memory for the session.
const geocodeCache = new Map<string, LatLng | null>()
let lastGeocodeTime = 0

/**
 * Geocodes an address string to lat/lng via Nominatim (OpenStreetMap).
 * Returns null if not found or on error.
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase()
  if (geocodeCache.has(key)) return geocodeCache.get(key)!

  // Respect Nominatim's 1 req/sec policy
  const now = Date.now()
  const elapsed = now - lastGeocodeTime
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed))
  }

  try {
    lastGeocodeTime = Date.now()
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    const res = await fetch(url, {
      headers: {
        // Nominatim requires a User-Agent identifying your application
        'User-Agent': 'Furever/1.0 (https://furever.app)',
      },
    })
    if (!res.ok) {
      geocodeCache.set(key, null)
      return null
    }
    const data = (await res.json()) as Array<{ lat: string; lon: string }>
    if (!data.length) {
      geocodeCache.set(key, null)
      return null
    }
    const result: LatLng = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    geocodeCache.set(key, result)
    return result
  } catch {
    geocodeCache.set(key, null)
    return null
  }
}

/**
 * Gets the user's current location via the browser Geolocation API.
 * Returns null if permission denied or not available.
 */
export function getUserLocation(): Promise<LatLng | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000 }
    )
  })
}
