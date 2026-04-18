export interface GeocodingResult {
  latitude: number
  longitude: number
  formatted_address: string
  confidence: number
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) {
    console.warn('[ORS] ORS_API_KEY not set — skipping geocoding')
    return null
  }

  const url = new URL('https://api.openrouteservice.org/geocode/search')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('text', address)
  url.searchParams.set('boundary.country', 'FR')
  url.searchParams.set('size', '1')

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      console.warn(`[ORS] Geocoding request failed: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    const features = data?.features
    if (!Array.isArray(features) || features.length === 0) {
      console.warn(`[ORS] No geocoding results for: ${address}`)
      return null
    }

    const feature = features[0]
    const [longitude, latitude] = feature.geometry.coordinates as [number, number]
    const props = feature.properties ?? {}

    return {
      latitude,
      longitude,
      formatted_address: props.label ?? address,
      confidence: props.confidence ?? 0,
    }
  } catch (error) {
    console.warn('[ORS] Geocoding error:', error instanceof Error ? error.message : 'unknown error')
    return null
  }
}
