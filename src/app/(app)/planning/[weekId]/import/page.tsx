import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { ImportClient } from '@/components/planning/import-client'

export default async function ImportPage({ params }: { params: Promise<{ weekId: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { weekId } = await params
  const [schedule] = await db
    .select()
    .from(weeklySchedules)
    .where(eq(weeklySchedules.id, weekId))
    .limit(1)

  if (!schedule) notFound()

  const validStatuses = ['configured', 'imported', 'generated', 'modified', 'confirmed']
  if (!validStatuses.includes(schedule.status)) {
    redirect(`/planning/${weekId}`)
  }

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

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Import des demandes</h1>
        <Badge variant={schedule.status === 'imported' ? 'default' : 'secondary'}>
          {schedule.status === 'imported' ? 'Importé' : 'En attente'}
        </Badge>
      </div>

      <ImportClient scheduleId={weekId} />
    </div>
  )
}
