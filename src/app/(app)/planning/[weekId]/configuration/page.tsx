import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules, driverAvailabilities, drivers, vehicles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { AvailabilityGrid } from '@/components/planning/availability-grid'

export default async function ConfigurationPage({
  params,
}: {
  params: Promise<{ weekId: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { weekId } = await params

  // Fetch schedule
  const [schedule] = await db
    .select()
    .from(weeklySchedules)
    .where(eq(weeklySchedules.id, weekId))
    .limit(1)

  if (!schedule) notFound()

  // Fetch existing availabilities
  const existingAvailabilities = await db
    .select({
      driverId: driverAvailabilities.driverId,
      vehicleId: driverAvailabilities.vehicleId,
      dayOfWeek: driverAvailabilities.dayOfWeek,
      startTime: driverAvailabilities.startTime,
      endTime: driverAvailabilities.endTime,
      isAvailable: driverAvailabilities.isAvailable,
    })
    .from(driverAvailabilities)
    .where(eq(driverAvailabilities.scheduleId, weekId))

  // Fetch active drivers and vehicles
  const activeDrivers = await db
    .select()
    .from(drivers)
    .where(eq(drivers.isActive, true))
    .orderBy(drivers.name)

  const activeVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.isActive, true))
    .orderBy(vehicles.name)

  // Find previous schedule for duplication
  const [previousSchedule] = await db
    .select({ id: weeklySchedules.id })
    .from(weeklySchedules)
    .where(eq(weeklySchedules.status, 'configured'))
    .orderBy(desc(weeklySchedules.weekStartDate))
    .limit(1)

  const previousScheduleId =
    previousSchedule && previousSchedule.id !== weekId ? previousSchedule.id : null

  const weekDate = new Date(schedule.weekStartDate + 'T00:00:00')
  const formattedDate = weekDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/planning/${weekId}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Semaine du {formattedDate}
        </Link>
      </div>

      <AvailabilityGrid
        scheduleId={weekId}
        drivers={activeDrivers}
        vehicles={activeVehicles}
        existingAvailabilities={existingAvailabilities}
        previousScheduleId={previousScheduleId}
      />
    </div>
  )
}
