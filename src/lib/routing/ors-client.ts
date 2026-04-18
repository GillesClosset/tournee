// ─── ORS Matrix + Directions Client ─────────────────────────────────────────

export interface GeocodingResult {
  latitude: number
  longitude: number
  formatted_address: string
  confidence: number
}

export interface MatrixResult {
  durations: number[][] // seconds
  distances: number[][] // meters
}

export interface DirectionsResult {
  durationSeconds: number
  distanceMeters: number
}

/**
 * Fetch a travel time/distance matrix from ORS for a set of coordinates.
 * ORS caps at 50×50 per call — this function handles chunking.
 *
 * @param coordinates Array of [longitude, latitude] pairs (ORS uses lng,lat order)
 */
export async function fetchTravelTimeMatrix(
  coordinates: [number, number][],
): Promise<MatrixResult> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) {
    console.warn('[ORS] ORS_API_KEY not set — returning zero matrix')
    return zeroMatrix(coordinates.length)
  }

  if (coordinates.length <= 50) {
    return fetchMatrixChunk(apiKey, coordinates)
  }

  // Chunking: build full matrix from sub-calls
  // For simplicity, we'll do pairwise requests for larger sets
  // This is a rare edge case (>50 unique locations in one week)
  const n = coordinates.length
  const durations: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  const distances: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))

  const chunkSize = 50
  for (let i = 0; i < n; i += chunkSize) {
    for (let j = 0; j < n; j += chunkSize) {
      const rowEnd = Math.min(i + chunkSize, n)
      const colEnd = Math.min(j + chunkSize, n)

      // Build source and destination indices
      const sources = Array.from({ length: rowEnd - i }, (_, k) => i + k)
      const destinations = Array.from({ length: colEnd - j }, (_, k) => j + k)

      // Combine unique indices
      const uniqueIndices = [...new Set([...sources, ...destinations])].sort((a, b) => a - b)
      const subCoords = uniqueIndices.map((idx) => coordinates[idx])

      const sourceIndicesInSub = sources.map((s) => uniqueIndices.indexOf(s))
      const destIndicesInSub = destinations.map((d) => uniqueIndices.indexOf(d))

      const chunk = await fetchMatrixChunkWithSourcesDests(
        apiKey,
        subCoords,
        sourceIndicesInSub,
        destIndicesInSub,
      )

      for (let si = 0; si < sources.length; si++) {
        for (let di = 0; di < destinations.length; di++) {
          durations[sources[si]][destinations[di]] = chunk.durations[si][di]
          distances[sources[si]][destinations[di]] = chunk.distances[si][di]
        }
      }
    }
  }

  return { durations, distances }
}

async function fetchMatrixChunk(
  apiKey: string,
  coordinates: [number, number][],
): Promise<MatrixResult> {
  const response = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      locations: coordinates,
      metrics: ['duration', 'distance'],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`[ORS] Matrix request failed: ${response.status} — ${text}`)
  }

  const data = await response.json()
  return {
    durations: data.durations,
    distances: data.distances,
  }
}

async function fetchMatrixChunkWithSourcesDests(
  apiKey: string,
  coordinates: [number, number][],
  sources: number[],
  destinations: number[],
): Promise<MatrixResult> {
  const response = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      locations: coordinates,
      sources,
      destinations,
      metrics: ['duration', 'distance'],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`[ORS] Matrix request failed: ${response.status} — ${text}`)
  }

  const data = await response.json()
  return {
    durations: data.durations,
    distances: data.distances,
  }
}

/**
 * Fetch directions (single pair) from ORS.
 */
export async function fetchDirections(
  origin: [number, number],
  destination: [number, number],
): Promise<DirectionsResult | null> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) {
    console.warn('[ORS] ORS_API_KEY not set — skipping directions')
    return null
  }

  try {
    const response = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car/json',
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          coordinates: [origin, destination],
        }),
      },
    )

    if (!response.ok) {
      console.warn(`[ORS] Directions request failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    const route = data.routes?.[0]?.summary
    if (!route) return null

    return {
      durationSeconds: route.duration,
      distanceMeters: route.distance,
    }
  } catch (error) {
    console.warn('[ORS] Directions error:', error instanceof Error ? error.message : 'unknown')
    return null
  }
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

function zeroMatrix(n: number): MatrixResult {
  return {
    durations: Array.from({ length: n }, () => new Array(n).fill(0)),
    distances: Array.from({ length: n }, () => new Array(n).fill(0)),
  }
}
