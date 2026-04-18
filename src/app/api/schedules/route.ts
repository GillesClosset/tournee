import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules, driverAvailabilities } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'
import { createScheduleSchema } from '@/lib/validators/schedule.schema'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await db
      .select({
        id: weeklySchedules.id,
        weekStartDate: weeklySchedules.weekStartDate,
        status: weeklySchedules.status,
        notes: weeklySchedules.notes,
        createdAt: weeklySchedules.createdAt,
        updatedAt: weeklySchedules.updatedAt,
        availabilityCount: count(driverAvailabilities.id),
      })
      .from(weeklySchedules)
      .leftJoin(driverAvailabilities, eq(weeklySchedules.id, driverAvailabilities.scheduleId))
      .groupBy(weeklySchedules.id)
      .orderBy(desc(weeklySchedules.weekStartDate))

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
    const parsed = createScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Check if schedule for this week already exists
    const existing = await db
      .select({ id: weeklySchedules.id })
      .from(weeklySchedules)
      .where(eq(weeklySchedules.weekStartDate, parsed.data.week_start_date))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Un planning existe déjà pour cette semaine' },
        { status: 409 },
      )
    }

    const [schedule] = await db
      .insert(weeklySchedules)
      .values({ weekStartDate: parsed.data.week_start_date })
      .returning()

    return NextResponse.json({ data: schedule }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
