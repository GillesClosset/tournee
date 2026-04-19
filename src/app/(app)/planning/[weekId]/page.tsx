import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { weeklySchedules } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  configured: 'Configuré',
  imported: 'Importé',
  generated: 'Généré',
  modified: 'Modifié',
  confirmed: 'Confirmé',
}

interface StepDef {
  label: string
  href: string
  enabled: boolean
}

export default async function WeekPage({ params }: { params: Promise<{ weekId: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { weekId } = await params
  const [schedule] = await db
    .select()
    .from(weeklySchedules)
    .where(eq(weeklySchedules.id, weekId))
    .limit(1)

  if (!schedule) notFound()

  const weekDate = new Date(schedule.weekStartDate + 'T00:00:00')
  const formattedDate = weekDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const steps: StepDef[] = [
    { label: 'Configuration', href: `/planning/${weekId}/configuration`, enabled: true },
    {
      label: 'Import',
      href: `/planning/${weekId}/import`,
      enabled: ['configured', 'imported', 'generated', 'modified', 'confirmed'].includes(
        schedule.status,
      ),
    },
    {
      label: 'Tournées',
      href: `/planning/${weekId}/tournees`,
      enabled: ['generated', 'modified', 'confirmed'].includes(schedule.status),
    },
    { label: 'Export', href: `/planning/${weekId}/export`, enabled: false },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/planning" className="text-muted-foreground hover:text-foreground text-sm">
          ← Planning
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Semaine du {formattedDate}</h1>
        <Badge variant={schedule.status === 'draft' ? 'secondary' : 'default'}>
          {STATUS_LABELS[schedule.status] ?? schedule.status}
        </Badge>
      </div>

      <div className="flex gap-2">
        {steps.map((step) =>
          step.enabled ? (
            <Link key={step.label} href={step.href}>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                {step.label}
              </Badge>
            </Link>
          ) : (
            <Badge key={step.label} variant="secondary" className="opacity-50">
              {step.label}
            </Badge>
          ),
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vue d&apos;ensemble</CardTitle>
          <CardDescription>
            Cliquez sur &quot;Configuration&quot; pour gérer les disponibilités des chauffeurs.
          </CardDescription>
          <CardAction>
            <Link href={`/planning/${weekId}/configuration`}>
              <Badge variant="default" className="cursor-pointer">
                Configurer →
              </Badge>
            </Link>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  )
}
