import { db } from '@/lib/db'
import { tours, tourStops, missionRequests, weeklySchedules } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import type { TourEditAction } from '@/lib/validators/tour-edits'

/**
 * Apply a batch of tour edit actions within a single transaction.
 * Rewrites sequence_order gap-free (1..N) for affected tours.
 * Sets tour + schedule status to 'modified'.
 */
export async function applyTourEdits(scheduleId: string, actions: TourEditAction[]) {
  await db.transaction(async (tx) => {
    const affectedTourIds = new Set<string>()

    for (const action of actions) {
      switch (action.type) {
        case 'reorder': {
          affectedTourIds.add(action.tourId)
          // First, set all stops to negative sequence to avoid unique constraint violations
          for (let i = 0; i < action.stopIds.length; i++) {
            await tx
              .update(tourStops)
              .set({ sequenceOrder: -(i + 1), updatedAt: new Date() })
              .where(and(eq(tourStops.id, action.stopIds[i]), eq(tourStops.tourId, action.tourId)))
          }
          // Then set to positive final values
          for (let i = 0; i < action.stopIds.length; i++) {
            await tx
              .update(tourStops)
              .set({ sequenceOrder: i + 1, updatedAt: new Date() })
              .where(and(eq(tourStops.id, action.stopIds[i]), eq(tourStops.tourId, action.tourId)))
          }
          break
        }

        case 'move': {
          affectedTourIds.add(action.fromTourId)
          affectedTourIds.add(action.toTourId)

          // Move the stop to the target tour with a temporary negative sequence
          await tx
            .update(tourStops)
            .set({
              tourId: action.toTourId,
              sequenceOrder: -1,
              updatedAt: new Date(),
            })
            .where(and(eq(tourStops.id, action.stopId), eq(tourStops.tourId, action.fromTourId)))

          // Rewrite source tour sequences (gap-free 1..N)
          await rewriteSequences(tx, action.fromTourId)

          // Insert stop at correct position in destination tour
          // First, shift existing stops at insertIndex+ up by 1 (use negative to avoid conflicts)
          const destStops = await tx
            .select({ id: tourStops.id, sequenceOrder: tourStops.sequenceOrder })
            .from(tourStops)
            .where(
              and(eq(tourStops.tourId, action.toTourId), sql`${tourStops.id} != ${action.stopId}`),
            )
            .orderBy(tourStops.sequenceOrder)

          // Build new order: insert moved stop at insertIndex
          const newOrder: string[] = []
          for (let i = 0; i < destStops.length; i++) {
            if (i === action.insertIndex) newOrder.push(action.stopId)
            newOrder.push(destStops[i].id)
          }
          if (action.insertIndex >= destStops.length) newOrder.push(action.stopId)

          // Write sequences using negative-then-positive to avoid unique constraint
          for (let i = 0; i < newOrder.length; i++) {
            await tx
              .update(tourStops)
              .set({ sequenceOrder: -(i + 1), updatedAt: new Date() })
              .where(and(eq(tourStops.id, newOrder[i]), eq(tourStops.tourId, action.toTourId)))
          }
          for (let i = 0; i < newOrder.length; i++) {
            await tx
              .update(tourStops)
              .set({ sequenceOrder: i + 1, updatedAt: new Date() })
              .where(and(eq(tourStops.id, newOrder[i]), eq(tourStops.tourId, action.toTourId)))
          }
          break
        }

        case 'remove': {
          // Find the stop to get its tourId and missionRequestId
          const [stop] = await tx
            .select({ tourId: tourStops.tourId, missionRequestId: tourStops.missionRequestId })
            .from(tourStops)
            .where(eq(tourStops.id, action.stopId))
            .limit(1)

          if (!stop) break

          affectedTourIds.add(stop.tourId)

          // Delete the stop
          await tx.delete(tourStops).where(eq(tourStops.id, action.stopId))

          // Rewrite sequences for the tour
          await rewriteSequences(tx, stop.tourId)

          // Set mission back to pending
          if (stop.missionRequestId) {
            await tx
              .update(missionRequests)
              .set({ status: 'pending', updatedAt: new Date() })
              .where(eq(missionRequests.id, stop.missionRequestId))
          }
          break
        }

        case 'assign': {
          affectedTourIds.add(action.tourId)

          // Get mission details for the new stop
          const [mission] = await tx
            .select({
              id: missionRequests.id,
              locationId: missionRequests.locationId,
              requestedTime: missionRequests.requestedTime,
            })
            .from(missionRequests)
            .where(eq(missionRequests.id, action.missionId))
            .limit(1)

          if (!mission) break

          // Get current max sequence in tour
          const [maxSeq] = await tx
            .select({ max: sql<number>`COALESCE(MAX(${tourStops.sequenceOrder}), 0)` })
            .from(tourStops)
            .where(eq(tourStops.tourId, action.tourId))

          const nextSeq = (maxSeq?.max ?? 0) + 1

          // Insert new stop at end
          await tx.insert(tourStops).values({
            tourId: action.tourId,
            sequenceOrder: nextSeq,
            locationId: mission.locationId,
            missionRequestId: mission.id,
            scheduledTime: mission.requestedTime,
            travelTimeMinutes: 0,
            parkingExtraMinutes: 0,
            accompanimentExtraMinutes: 0,
            isOptional: false,
            isManualTask: false,
          })

          // Set mission to assigned
          await tx
            .update(missionRequests)
            .set({ status: 'assigned', updatedAt: new Date() })
            .where(eq(missionRequests.id, action.missionId))
          break
        }
      }
    }

    // Update status for all affected tours
    for (const tourId of affectedTourIds) {
      // Recalculate totalTravelMinutes by summing stops
      const [result] = await tx
        .select({
          total: sql<number>`COALESCE(SUM(${tourStops.travelTimeMinutes}), 0)`,
        })
        .from(tourStops)
        .where(eq(tourStops.tourId, tourId))

      await tx
        .update(tours)
        .set({
          status: 'modified',
          totalTravelMinutes: result?.total ?? 0,
          updatedAt: new Date(),
        })
        .where(eq(tours.id, tourId))
    }

    // Update schedule status to 'modified'
    await tx
      .update(weeklySchedules)
      .set({ status: 'modified', updatedAt: new Date() })
      .where(eq(weeklySchedules.id, scheduleId))
  })
}

/**
 * Rewrite sequence_order for all stops in a tour to be gap-free 1..N.
 * Uses negative-then-positive to avoid unique constraint violations.
 */
async function rewriteSequences(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tourId: string,
) {
  const stops = await tx
    .select({ id: tourStops.id })
    .from(tourStops)
    .where(eq(tourStops.tourId, tourId))
    .orderBy(tourStops.sequenceOrder)

  // Set to negative first
  for (let i = 0; i < stops.length; i++) {
    await tx
      .update(tourStops)
      .set({ sequenceOrder: -(i + 1) })
      .where(eq(tourStops.id, stops[i].id))
  }
  // Then set to positive
  for (let i = 0; i < stops.length; i++) {
    await tx
      .update(tourStops)
      .set({ sequenceOrder: i + 1, updatedAt: new Date() })
      .where(eq(tourStops.id, stops[i].id))
  }
}
