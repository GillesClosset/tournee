import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { updateScheduleSchema } from '@/lib/validators/schedule.schema'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = await params
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1)

    if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: schedule })
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
    const body = await request.json()
    const parsed = updateScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const [schedule] = await db
      .update(weeklySchedules)
      .set({
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
        updatedAt: new Date(),
      })
      .where(eq(weeklySchedules.id, scheduleId))
      .returning()

    if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: schedule })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
