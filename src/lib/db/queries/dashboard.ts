import { db } from '@/lib/db'
import {
  weeklySchedules,
  tours,
  tourStops,
  missionRequests,
  driverAvailabilities,
} from '@/lib/db/schema'
import { eq, desc, sql, and, count } from 'drizzle-orm'
import type { DashboardData } from '@/types/domain'

export async function fetchDashboardData(): Promise<DashboardData> {
  // 1. Get most recent schedule
  const [latestSchedule] = await db
    .select({
      id: weeklySchedules.id,
      weekStartDate: weeklySchedules.weekStartDate,
      status: weeklySchedules.status,
    })
    .from(weeklySchedules)
    .orderBy(desc(weeklySchedules.weekStartDate))
    .limit(1)

  if (!latestSchedule) {
    return {
      schedule: null,
      stats: { totalTours: 0, totalStops: 0, totalUnassigned: 0, totalTravelMinutes: 0 },
      perDay: [],
    }
  }

  const scheduleId = latestSchedule.id

  // 2. Tour count + total travel minutes
  const [tourAgg] = await db
    .select({
      totalTours: count(tours.id),
      totalTravelMinutes: sql<number>`coalesce(sum(${tours.totalTravelMinutes}), 0)`.as(
        'totalTravelMinutes',
      ),
    })
    .from(tours)
    .where(eq(tours.scheduleId, scheduleId))

  // 3. Total stops
  const [stopAgg] = await db
    .select({
      totalStops: count(tourStops.id),
    })
    .from(tourStops)
    .innerJoin(tours, eq(tourStops.tourId, tours.id))
    .where(eq(tours.scheduleId, scheduleId))

  // 4. Unassigned missions
  const [unassignedAgg] = await db
    .select({
      totalUnassigned: count(missionRequests.id),
    })
    .from(missionRequests)
    .where(and(eq(missionRequests.scheduleId, scheduleId), eq(missionRequests.status, 'pending')))

  // 5. Per-day tour counts
  const perDayRows = await db
    .select({
      dayOfWeek: driverAvailabilities.dayOfWeek,
      tourCount: count(tours.id),
    })
    .from(tours)
    .innerJoin(driverAvailabilities, eq(tours.driverAvailabilityId, driverAvailabilities.id))
    .where(eq(tours.scheduleId, scheduleId))
    .groupBy(driverAvailabilities.dayOfWeek)
    .orderBy(driverAvailabilities.dayOfWeek)

  return {
    schedule: {
      id: latestSchedule.id,
      weekStartDate: latestSchedule.weekStartDate,
      status: latestSchedule.status,
    },
    stats: {
      totalTours: tourAgg.totalTours,
      totalStops: stopAgg.totalStops,
      totalUnassigned: unassignedAgg.totalUnassigned,
      totalTravelMinutes: Number(tourAgg.totalTravelMinutes),
    },
    perDay: perDayRows.map((r) => ({ dayOfWeek: r.dayOfWeek, tourCount: r.tourCount })),
  }
}
