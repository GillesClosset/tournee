import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { vehicles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createVehicleSchema, updateVehicleSchema } from '@/lib/validators/vehicle.schema'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await db.select().from(vehicles).orderBy(vehicles.name)
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
    const parsed = createVehicleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const [vehicle] = await db
      .insert(vehicles)
      .values({
        name: parsed.data.name,
        licensePlate: parsed.data.license_plate,
        notes: parsed.data.notes,
      })
      .returning()

    return NextResponse.json({ data: vehicle }, { status: 201 })
  } catch (err: unknown) {
    // Unique constraint on license_plate
    if (err instanceof Error && err.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Cette immatriculation est déjà utilisée' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = updateVehicleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { id, is_active, license_plate, ...rest } = parsed.data

    const [vehicle] = await db
      .update(vehicles)
      .set({
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.notes !== undefined && { notes: rest.notes }),
        ...(license_plate !== undefined && { licensePlate: license_plate }),
        ...(is_active !== undefined && { isActive: is_active }),
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning()

    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: vehicle })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('unique')) {
      return NextResponse.json(
        { error: 'Cette immatriculation est déjà utilisée' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
