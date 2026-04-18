import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { driverAvailabilities, weeklySchedules, drivers, vehicles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { bulkUpsertAvailabilitiesSchema } from '@/lib/validators/schedule.schema'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = await params
    const data = await db
      .select({
        id: driverAvailabilities.id,
        scheduleId: driverAvailabilities.scheduleId,
        driverId: driverAvailabilities.driverId,
        vehicleId: driverAvailabilities.vehicleId,
        dayOfWeek: driverAvailabilities.dayOfWeek,
        startTime: driverAvailabilities.startTime,
        endTime: driverAvailabilities.endTime,
        isAvailable: driverAvailabilities.isAvailable,
        createdAt: driverAvailabilities.createdAt,
        updatedAt: driverAvailabilities.updatedAt,
        driverName: drivers.name,
        vehicleName: vehicles.name,
        vehiclePlate: vehicles.licensePlate,
      })
      .from(driverAvailabilities)
      .leftJoin(drivers, eq(driverAvailabilities.driverId, drivers.id))
      .leftJoin(vehicles, eq(driverAvailabilities.vehicleId, vehicles.id))
      .where(eq(driverAvailabilities.scheduleId, scheduleId))

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = await params
    const body = await request.json()
    const parsed = bulkUpsertAvailabilitiesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Verify schedule exists
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1)

    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

    // Transaction: delete existing + insert new
    const result = await db.transaction(async (tx) => {
      await tx.delete(driverAvailabilities).where(eq(driverAvailabilities.scheduleId, scheduleId))

      let inserted: (typeof driverAvailabilities.$inferSelect)[] = []
      if (parsed.data.length > 0) {
        inserted = await tx
          .insert(driverAvailabilities)
          .values(
            parsed.data.map((item) => ({
              scheduleId,
              driverId: item.driver_id,
              vehicleId: item.vehicle_id ?? null,
              dayOfWeek: item.day_of_week,
              startTime: item.start_time,
              endTime: item.end_time,
              isAvailable: item.is_available,
            })),
          )
          .returning()
      }

      // Update schedule status to 'configured' if currently 'draft'
      if (schedule.status === 'draft') {
        await tx
          .update(weeklySchedules)
          .set({ status: 'configured', updatedAt: new Date() })
          .where(eq(weeklySchedules.id, scheduleId))
      }

      return inserted
    })

    return NextResponse.json({ data: result })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
