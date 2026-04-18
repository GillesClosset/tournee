import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { drivers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createDriverSchema, updateDriverSchema } from '@/lib/validators/driver.schema'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await db.select().from(drivers).orderBy(drivers.name)
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
    const parsed = createDriverSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const [driver] = await db
      .insert(drivers)
      .values({ name: parsed.data.name, notes: parsed.data.notes })
      .returning()

    return NextResponse.json({ data: driver }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = updateDriverSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { id, is_active, ...rest } = parsed.data

    const [driver] = await db
      .update(drivers)
      .set({
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.notes !== undefined && { notes: rest.notes }),
        ...(is_active !== undefined && { isActive: is_active }),
        updatedAt: new Date(),
      })
      .where(eq(drivers.id, id))
      .returning()

    if (!driver) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: driver })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
