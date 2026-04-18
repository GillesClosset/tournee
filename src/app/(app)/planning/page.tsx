import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules, driverAvailabilities } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'
import { PlanningListClient } from '@/components/planning/planning-list-client'

export default async function PlanningPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const schedules = await db
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

  return <PlanningListClient initialSchedules={schedules} />
}
