import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { fetchToursWithRelations } from '@/lib/db/queries/tours'
import { TourViewer } from '@/components/planning/tour-viewer'
import type { ScheduleStatus } from '@/types/domain'

const VIEWABLE_STATUSES: ScheduleStatus[] = ['generated', 'modified', 'confirmed']

export default async function TourneesPage({ params }: { params: Promise<{ weekId: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { weekId } = await params
  const [schedule] = await db
    .select()
    .from(weeklySchedules)
    .where(eq(weeklySchedules.id, weekId))
    .limit(1)

  if (!schedule) notFound()

  if (!VIEWABLE_STATUSES.includes(schedule.status as ScheduleStatus)) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href={`/planning/${weekId}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Retour
        </Link>
        <div className="text-center text-muted-foreground py-12">
          Les tournées n&apos;ont pas encore été générées pour cette semaine.
        </div>
      </div>
    )
  }

  const data = await fetchToursWithRelations(weekId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/planning/${weekId}`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Retour
        </Link>
        <h1 className="text-xl font-semibold">Tournées</h1>
      </div>
      <TourViewer data={data} />
    </div>
  )
}
