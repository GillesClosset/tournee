'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ScheduleRow {
  id: string
  weekStartDate: string
  status: string
  notes: string | null
  createdAt: Date
  updatedAt: Date
  availabilityCount: number
}

interface PlanningListClientProps {
  initialSchedules: ScheduleRow[]
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  configured: 'Configuré',
  imported: 'Importé',
  generated: 'Généré',
  modified: 'Modifié',
  confirmed: 'Confirmé',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  configured: 'default',
  imported: 'outline',
  generated: 'outline',
  modified: 'outline',
  confirmed: 'default',
}

function formatWeekDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `Semaine du ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
}

/** Snap a date to the Monday of its week */
function snapToMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function PlanningListClient({ initialSchedules }: PlanningListClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dateValue, setDateValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate() {
    if (!dateValue) return
    const monday = snapToMonday(dateValue)
    setSubmitting(true)
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start_date: monday }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(typeof err.error === 'string' ? err.error : 'Erreur serveur')
      }
      const { data } = await res.json()
      toast.success('Semaine créée')
      setDialogOpen(false)
      setDateValue('')
      router.push(`/planning/${data.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Planning</h1>
        <Button onClick={() => setDialogOpen(true)}>Nouvelle semaine</Button>
      </div>

      {initialSchedules.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>
              Aucune semaine planifiée. Créez votre première semaine.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {initialSchedules.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/planning/${s.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-base">{formatWeekDate(s.weekStartDate)}</CardTitle>
                <CardDescription>
                  {s.availabilityCount} disponibilité{s.availabilityCount !== 1 ? 's' : ''}{' '}
                  configurée{s.availabilityCount !== 1 ? 's' : ''}
                </CardDescription>
                <CardAction>
                  <Badge variant={STATUS_VARIANTS[s.status] ?? 'secondary'}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </Badge>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle semaine</DialogTitle>
            <DialogDescription>
              Sélectionnez une date. La semaine sera automatiquement alignée sur le lundi.
            </DialogDescription>
          </DialogHeader>
          <Input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
          {dateValue && (
            <p className="text-sm text-muted-foreground">
              → {formatWeekDate(snapToMonday(dateValue))}
            </p>
          )}
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!dateValue || submitting}>
              {submitting ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
