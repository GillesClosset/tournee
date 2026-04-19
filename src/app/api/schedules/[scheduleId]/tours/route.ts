import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { fetchToursWithRelations } from '@/lib/db/queries/tours'
import { tourEditPayloadSchema } from '@/lib/validators/tour-edits'
import { applyTourEdits } from '@/lib/db/queries/tour-edits'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = await params

    // Verify schedule exists
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1)

    if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const data = await fetchToursWithRelations(scheduleId)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = await params

    // Verify schedule exists
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1)

    if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Parse and validate payload
    const body = await request.json()
    const parsed = tourEditPayloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 },
      )
    }

    // Apply edits in transaction
    await applyTourEdits(scheduleId, parsed.data.actions)

    // Return updated data
    const data = await fetchToursWithRelations(scheduleId)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
