export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { fetchDashboardData } from '@/lib/db/queries/dashboard'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  RouteIcon,
  MapPinIcon,
  AlertTriangleIcon,
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  UploadIcon,
  UsersIcon,
} from 'lucide-react'

const DAY_LABELS = ['', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const STATUS_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  configured: { label: 'Configuré', variant: 'secondary' },
  imported: { label: 'Importé', variant: 'outline' },
  generated: { label: 'Généré', variant: 'default' },
  modified: { label: 'Modifié', variant: 'outline' },
  confirmed: { label: 'Confirmé', variant: 'default' },
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
}

export default async function DashboardPage() {
  const data = await fetchDashboardData()

  if (!data.schedule) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
        <CalendarIcon className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Aucun planning</h2>
        <p className="text-muted-foreground">
          Créez votre premier planning hebdomadaire pour commencer.
        </p>
        <Link
          href="/planning"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon className="size-4" />
          Créer un planning
        </Link>
      </div>
    )
  }

  const { schedule, stats, perDay } = data
  const statusInfo = STATUS_LABELS[schedule.status] ?? {
    label: schedule.status,
    variant: 'outline' as const,
  }

  // Build per-day map for Mon-Fri (1-5)
  const perDayMap = new Map(perDay.map((d) => [d.dayOfWeek, d.tourCount]))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        <span className="text-sm text-muted-foreground">
          Semaine du{' '}
          {new Date(schedule.weekStartDate + 'T00:00:00').toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={RouteIcon} label="Tournées" value={stats.totalTours} />
        <StatCard icon={MapPinIcon} label="Arrêts" value={stats.totalStops} />
        <StatCard icon={AlertTriangleIcon} label="Non assignées" value={stats.totalUnassigned} />
        <StatCard
          icon={ClockIcon}
          label="Temps de trajet"
          value={formatMinutes(stats.totalTravelMinutes)}
        />
      </div>

      {/* Per-day breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Tournées par jour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((day) => (
              <div key={day} className="flex flex-col items-center rounded-lg border p-3">
                <span className="text-sm font-medium text-muted-foreground">{DAY_LABELS[day]}</span>
                <span className="text-2xl font-bold">{perDayMap.get(day) ?? 0}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/planning/${schedule.id}/tours`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <RouteIcon className="size-4" />
              Voir les tournées
            </Link>
            <Link
              href={`/planning/${schedule.id}/import`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <UploadIcon className="size-4" />
              Importer des missions
            </Link>
            <Link
              href={`/planning/${schedule.id}`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <UsersIcon className="size-4" />
              Disponibilités
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
