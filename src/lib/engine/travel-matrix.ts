// ─── Travel Matrix Builder with Cache ────────────────────────────────────────

import { and, inArray, lt } from 'drizzle-orm'
import { travelTimeCache, locations } from '@/lib/db/schema'
import { fetchTravelTimeMatrix } from '@/lib/routing/ors-client'
import { CACHE_TTL_DAYS, DEPOT } from './constants'
import type { TravelMatrix } from './types'
import { matrixKey } from './types'

/** Depot uses a virtual location ID */
export const DEPOT_LOCATION_ID = '__depot__'

interface LocationCoords {
  id: string
  latitude: number
  longitude: number
}

/**
 * Build a complete travel matrix for all location IDs (including depot).
 * Uses DB cache, fetches missing pairs from ORS, and stores new results.
 */
export async function buildTravelMatrix(
  locationIds: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  database: any,
): Promise<TravelMatrix> {
  const matrix: TravelMatrix = new Map()

  // Ensure depot is included
  const allIds = [...new Set([DEPOT_LOCATION_ID, ...locationIds])]

  // 1. Get coordinates for all locations
  const coordsMap = new Map<string, LocationCoords>()
  coordsMap.set(DEPOT_LOCATION_ID, {
    id: DEPOT_LOCATION_ID,
    latitude: DEPOT.latitude,
    longitude: DEPOT.longitude,
  })

  const dbLocationIds = allIds.filter((id) => id !== DEPOT_LOCATION_ID)
  if (dbLocationIds.length > 0) {
    const dbLocations = await database
      .select({
        id: locations.id,
        latitude: locations.latitude,
        longitude: locations.longitude,
      })
      .from(locations)
      .where(inArray(locations.id, dbLocationIds))

    for (const loc of dbLocations) {
      if (loc.latitude !== null && loc.longitude !== null) {
        coordsMap.set(loc.id, {
          id: loc.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
        })
      }
    }
  }

  // 2. Purge stale cache entries
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - CACHE_TTL_DAYS)
  await database.delete(travelTimeCache).where(lt(travelTimeCache.cachedAt, cutoff))

  // 3. Load cached pairs (only DB location IDs, not depot)
  const cachedIds = [...coordsMap.keys()].filter((id) => id !== DEPOT_LOCATION_ID)
  if (cachedIds.length > 0) {
    const cached = await database
      .select()
      .from(travelTimeCache)
      .where(
        and(
          inArray(travelTimeCache.originLocationId, cachedIds),
          inArray(travelTimeCache.destLocationId, cachedIds),
        ),
      )

    for (const entry of cached) {
      if (entry.originLocationId && entry.destLocationId) {
        matrix.set(matrixKey(entry.originLocationId, entry.destLocationId), {
          seconds: entry.durationSeconds,
          meters: entry.distanceMeters,
        })
      }
    }
  }

  // 4. Identify missing pairs
  const allCoordIds = [...coordsMap.keys()]
  const missingPairs: [string, string][] = []
  for (const o of allCoordIds) {
    for (const d of allCoordIds) {
      if (o === d) continue
      if (!matrix.has(matrixKey(o, d))) {
        missingPairs.push([o, d])
      }
    }
  }

  if (missingPairs.length === 0) return matrix

  // 5. Fetch full matrix from ORS for all locations with coords
  const orderedIds = allCoordIds.filter((id) => coordsMap.has(id))
  const coordinates: [number, number][] = orderedIds.map((id) => {
    const c = coordsMap.get(id)!
    return [c.longitude, c.latitude] // ORS uses [lng, lat]
  })

  if (coordinates.length < 2) return matrix

  const orsResult = await fetchTravelTimeMatrix(coordinates)

  // 6. Fill matrix and prepare cache inserts
  const cacheInserts: {
    originLocationId: string | null
    destLocationId: string | null
    originLat: number
    originLng: number
    destLat: number
    destLng: number
    durationSeconds: number
    distanceMeters: number
  }[] = []

  for (let i = 0; i < orderedIds.length; i++) {
    for (let j = 0; j < orderedIds.length; j++) {
      if (i === j) continue
      const oId = orderedIds[i]
      const dId = orderedIds[j]
      const key = matrixKey(oId, dId)

      if (!matrix.has(key)) {
        const seconds = Math.round(orsResult.durations[i][j])
        const meters = Math.round(orsResult.distances[i][j])
        matrix.set(key, { seconds, meters })

        // Only cache DB locations (not depot)
        if (oId !== DEPOT_LOCATION_ID && dId !== DEPOT_LOCATION_ID) {
          const oCoords = coordsMap.get(oId)!
          const dCoords = coordsMap.get(dId)!
          cacheInserts.push({
            originLocationId: oId,
            destLocationId: dId,
            originLat: oCoords.latitude,
            originLng: oCoords.longitude,
            destLat: dCoords.latitude,
            destLng: dCoords.longitude,
            durationSeconds: seconds,
            distanceMeters: meters,
          })
        }
      }
    }
  }

  // 7. Insert new cache entries
  if (cacheInserts.length > 0) {
    // Batch insert, ignore conflicts (unique constraint)
    for (const insert of cacheInserts) {
      try {
        await database.insert(travelTimeCache).values(insert).onConflictDoNothing()
      } catch {
        // Ignore individual insert errors
      }
    }
  }

  return matrix
}
