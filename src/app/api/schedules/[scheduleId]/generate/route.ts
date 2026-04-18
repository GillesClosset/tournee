import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateRequestSchema, GENERATABLE_STATUSES } from '@/lib/validators/generate.schema'
import { generateTours } from '@/lib/engine/generate'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId } = await params

    // Parse optional body
    let force = false
    try {
      const body = await request.json()
      const parsed = generateRequestSchema.safeParse(body)
      if (parsed.success) {
        force = parsed.data.force
      }
    } catch {
      // No body or invalid JSON — that's fine, use defaults
    }

    // Validate schedule exists and is in a generatable status
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1)

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const isGeneratable = (GENERATABLE_STATUSES as readonly string[]).includes(schedule.status)
    const isRegenerable = schedule.status === 'generated' || schedule.status === 'modified'

    if (!isGeneratable && !(isRegenerable && force)) {
      return NextResponse.json(
        {
          error: `Schedule status "${schedule.status}" does not allow generation. Expected: ${GENERATABLE_STATUSES.join(', ')}. Use force=true to regenerate.`,
        },
        { status: 400 },
      )
    }

    const result = await generateTours(scheduleId)

    return NextResponse.json({
      data: {
        summary: result.stats,
        warnings: result.warnings,
        unassigned: result.unassigned,
      },
    })
  } catch (error) {
    console.error('[Generate] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
