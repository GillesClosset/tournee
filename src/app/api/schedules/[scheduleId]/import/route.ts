import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules, missionRequests, locations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { runImportPipeline } from '@/lib/import/import-pipeline'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = await params

    // Verify schedule exists and is in a valid state for import
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1)

    if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const validStatuses = ['configured', 'imported']
    if (!validStatuses.includes(schedule.status)) {
      return NextResponse.json(
        {
          error: `Le planning doit être configuré avant l'import (statut actuel: ${schedule.status})`,
        },
        { status: 400 },
      )
    }

    // Read uploaded file
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Le fichier doit être au format .xlsx' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()

    // Load active locations
    const allLocations = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(eq(locations.isActive, true))

    // Run import pipeline
    const result = runImportPipeline(buffer, allLocations)

    if (result.rows.length === 0) {
      return NextResponse.json({
        imported: 0,
        warnings: result.warnings,
        errors:
          result.errors.length > 0
            ? result.errors
            : ['Aucune mission valide trouvée dans le fichier'],
      })
    }

    // Insert mission requests in a transaction
    await db.transaction(async (tx) => {
      // Delete existing mission requests for this schedule (re-import support)
      await tx.delete(missionRequests).where(eq(missionRequests.scheduleId, scheduleId))

      // Insert new rows
      await tx.insert(missionRequests).values(
        result.rows.map((row) => ({
          scheduleId,
          dayOfWeek: row.dayOfWeek,
          locationId: row.locationId,
          requestedTime: row.requestedTime,
          timeRangeEnd: row.timeRangeEnd,
          minorName: row.minorName,
          missionText: row.missionText,
          missionType: row.missionType,
          accompanimentType: row.accompanimentType,
          isPriorityFlagged: row.isPriorityFlagged,
          observations: row.observations,
          rawRowData: row.rawRowData,
        })),
      )

      // Update schedule status to imported
      await tx
        .update(weeklySchedules)
        .set({ status: 'imported', updatedAt: new Date() })
        .where(eq(weeklySchedules.id, scheduleId))
    })

    return NextResponse.json({
      imported: result.rows.length,
      warnings: result.warnings,
      errors: result.errors,
    })
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
