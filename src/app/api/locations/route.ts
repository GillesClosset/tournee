import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { locations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createLocationSchema, updateLocationSchema } from '@/lib/validators/location.schema'
import { geocodeAddress } from '@/lib/routing/ors-client'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await db.select().from(locations).orderBy(locations.name)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createLocationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const geocoded = await geocodeAddress(parsed.data.address)

    const [location] = await db
      .insert(locations)
      .values({
        name: parsed.data.name,
        address: parsed.data.address,
        locationType: parsed.data.location_type,
        parkingDifficulty: parsed.data.parking_difficulty,
        notes: parsed.data.notes,
        latitude: geocoded?.latitude ?? null,
        longitude: geocoded?.longitude ?? null,
      })
      .returning()

    const response: { data: typeof location; geocoding_warning?: string } = { data: location }
    if (!geocoded) {
      response.geocoding_warning =
        "L'adresse n'a pas pu être géocodée. Vérifiez l'adresse manuellement."
    }

    return NextResponse.json(response, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = updateLocationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { id, is_active, location_type, parking_difficulty, address, ...rest } = parsed.data

    let geocoded = undefined
    let geocodingWarning: string | undefined

    if (address !== undefined) {
      geocoded = await geocodeAddress(address)
      if (!geocoded) {
        geocodingWarning = "L'adresse n'a pas pu être géocodée. Vérifiez l'adresse manuellement."
      }
    }

    const [location] = await db
      .update(locations)
      .set({
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.notes !== undefined && { notes: rest.notes }),
        ...(address !== undefined && { address }),
        ...(location_type !== undefined && { locationType: location_type }),
        ...(parking_difficulty !== undefined && { parkingDifficulty: parking_difficulty }),
        ...(is_active !== undefined && { isActive: is_active }),
        ...(geocoded != null && {
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        }),
        ...(geocoded == null &&
          address !== undefined && {
            latitude: null,
            longitude: null,
          }),
        ...(geocoded === null &&
          address !== undefined && {
            latitude: null,
            longitude: null,
          }),
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id))
      .returning()

    if (!location) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const response: { data: typeof location; geocoding_warning?: string } = { data: location }
    if (geocodingWarning) response.geocoding_warning = geocodingWarning

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
