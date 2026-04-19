'use client'

import { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TourMapDynamic } from '@/components/planning/tour-map-dynamic'
import { TourCardEditable } from '@/components/planning/tour-card-editable'
import { toast } from 'sonner'
import type { ToursPageData, TourViewData, UnassignedMission } from '@/types/domain'
import type { TourEditAction } from '@/lib/validators/tour-edits'

const DAY_LABELS: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
}

const DAY_SHORT: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Jeu',
  5: 'Ven',
  6: 'Sam',
  7: 'Dim',
}

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function SummaryBar({ data }: { data: ToursPageData }) {
  const { summary } = data
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card>
        <CardHeader className="p-4">
          <CardDescription>Tournées</CardDescription>
          <CardTitle className="text-2xl">{summary.totalTours}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardDescription>Arrêts</CardDescription>
          <CardTitle className="text-2xl">{summary.totalStops}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardDescription>Non assignées</CardDescription>
          <CardTitle className="text-2xl">{summary.totalUnassigned}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="p-4">
          <CardDescription>Temps trajet</CardDescription>
          <CardTitle className="text-2xl">{summary.totalTravelMinutes} min</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

function UnassignedPanel({
  missions,
  dayOfWeek,
  onAssign,
  tours,
}: {
  missions: UnassignedMission[]
  dayOfWeek: number
  onAssign: (missionId: string, tourId: string) => void
  tours: TourViewData[]
}) {
  const dayMissions = missions.filter((m) => m.dayOfWeek === dayOfWeek)
  if (dayMissions.length === 0) return null

  return (
    <Card className="border-orange-200">
      <CardHeader className="p-4">
        <CardTitle className="text-base">
          Missions non assignées — {DAY_LABELS[dayOfWeek]} ({dayMissions.length})
        </CardTitle>
      </CardHeader>
      <div className="px-4 pb-4 space-y-2">
        {dayMissions.map((m) => (
          <div key={m.id} className="flex items-center gap-2 py-1 text-sm">
            <span className="font-mono text-muted-foreground">{formatTime(m.requestedTime)}</span>
            <span className="flex-1">{m.missionText}</span>
            {m.minorName && <span className="text-muted-foreground">({m.minorName})</span>}
            {m.locationName && (
              <Badge variant="outline" className="text-xs">
                {m.locationName}
              </Badge>
            )}
            <select
              className="text-xs border rounded px-1 py-0.5"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onAssign(m.id, e.target.value)
                  e.target.value = ''
                }
              }}
            >
              <option value="" disabled>
                Assigner à…
              </option>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.driverName}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function TourEditor({
  data: initialData,
  scheduleId,
}: {
  data: ToursPageData
  scheduleId: string
}) {
  const [data, setData] = useState<ToursPageData>(initialData)
  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const setCardRef = useCallback(
    (tourId: string) => (el: HTMLDivElement | null) => {
      if (el) cardRefs.current.set(tourId, el)
      else cardRefs.current.delete(tourId)
    },
    [],
  )

  const handleMapTourSelect = useCallback((tourId: string) => {
    setActiveTourId((prev) => (prev === tourId ? null : tourId))
    const el = cardRefs.current.get(tourId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const sendActions = useCallback(
    async (actions: TourEditAction[]) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/schedules/${scheduleId}/tours`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actions }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Erreur serveur')
        }
        const { data: updated } = await res.json()
        setData(updated)
        toast.success('Modifications enregistrées')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
        // Revert optimistic state by refetching
        try {
          const res = await fetch(`/api/schedules/${scheduleId}/tours`)
          if (res.ok) {
            const { data: fresh } = await res.json()
            setData(fresh)
          }
        } catch {
          // ignore refetch error
        }
      } finally {
        setSaving(false)
      }
    },
    [scheduleId],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeData = active.data.current as { type: string; tourId: string } | undefined
      if (!activeData || activeData.type !== 'stop') return

      // Check if dropping onto a different tour's droppable area
      const overData = over.data.current as { type: string; tourId?: string } | undefined

      if (overData?.type === 'tour' && overData.tourId && overData.tourId !== activeData.tourId) {
        // Move stop to another tour (append at end)
        const action: TourEditAction = {
          type: 'move',
          stopId: active.id as string,
          fromTourId: activeData.tourId,
          toTourId: overData.tourId,
          insertIndex: data.tours.find((t) => t.id === overData.tourId)?.stops.length ?? 0,
        }

        // Optimistic update
        setData((prev) => {
          const tours = prev.tours.map((t) => ({ ...t, stops: [...t.stops] }))
          const fromTour = tours.find((t) => t.id === activeData.tourId)
          const toTour = tours.find((t) => t.id === overData.tourId)
          if (fromTour && toTour) {
            const stopIdx = fromTour.stops.findIndex((s) => s.id === active.id)
            if (stopIdx >= 0) {
              const [stop] = fromTour.stops.splice(stopIdx, 1)
              stop.tourId = overData.tourId!
              toTour.stops.push(stop)
            }
          }
          return { ...prev, tours }
        })

        sendActions([action])
        return
      }

      // Same-tour reorder
      const overStopData = over.data.current as { type: string; tourId: string } | undefined
      if (overStopData?.type === 'stop' && overStopData.tourId === activeData.tourId) {
        const tourId = activeData.tourId
        const tour = data.tours.find((t) => t.id === tourId)
        if (!tour) return

        const oldIndex = tour.stops.findIndex((s) => s.id === active.id)
        const newIndex = tour.stops.findIndex((s) => s.id === over.id)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

        const newStops = arrayMove(tour.stops, oldIndex, newIndex)
        const newStopIds = newStops.map((s) => s.id)

        // Optimistic update
        setData((prev) => ({
          ...prev,
          tours: prev.tours.map((t) => (t.id === tourId ? { ...t, stops: newStops } : t)),
        }))

        const action: TourEditAction = {
          type: 'reorder',
          tourId,
          stopIds: newStopIds,
        }
        sendActions([action])
      }
    },
    [data.tours, sendActions],
  )

  const handleRemove = useCallback(
    (stopId: string) => {
      // Optimistic update
      setData((prev) => ({
        ...prev,
        tours: prev.tours.map((t) => ({
          ...t,
          stops: t.stops.filter((s) => s.id !== stopId),
        })),
      }))

      sendActions([{ type: 'remove', stopId }])
    },
    [sendActions],
  )

  const handleAssign = useCallback(
    (missionId: string, tourId: string) => {
      // Optimistic: remove from unassigned
      setData((prev) => ({
        ...prev,
        unassigned: prev.unassigned.filter((m) => m.id !== missionId),
      }))

      sendActions([{ type: 'assign', missionId, tourId }])
    },
    [sendActions],
  )

  // Group tours by day
  const toursByDay = new Map<number, TourViewData[]>()
  for (const tour of data.tours) {
    const existing = toursByDay.get(tour.dayOfWeek) ?? []
    existing.push(tour)
    toursByDay.set(tour.dayOfWeek, existing)
  }

  const daysWithTours = Array.from(toursByDay.keys()).sort((a, b) => a - b)
  const defaultDay = daysWithTours[0]?.toString() ?? '1'

  if (data.tours.length === 0 && data.unassigned.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Aucune tournée générée pour cette semaine.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SummaryBar data={data} />
      {saving && <div className="text-sm text-muted-foreground animate-pulse">Enregistrement…</div>}

      {data.tours.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-[400px] lg:h-[600px]">
              <TourMapDynamic
                tours={data.tours}
                activeTourId={activeTourId}
                onTourSelect={handleMapTourSelect}
              />
            </div>

            <div className="min-h-0 lg:max-h-[600px] lg:overflow-y-auto">
              {daysWithTours.length > 0 && (
                <Tabs defaultValue={defaultDay}>
                  <TabsList>
                    {daysWithTours.map((day) => (
                      <TabsTrigger key={day} value={day.toString()}>
                        {DAY_SHORT[day]} ({toursByDay.get(day)?.length ?? 0})
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {daysWithTours.map((day) => (
                    <TabsContent key={day} value={day.toString()} className="space-y-3 mt-3">
                      {toursByDay.get(day)?.map((tour) => (
                        <TourCardEditable
                          key={tour.id}
                          tour={tour}
                          isActive={activeTourId === tour.id}
                          onSelect={() =>
                            setActiveTourId((prev) => (prev === tour.id ? null : tour.id))
                          }
                          onRemove={handleRemove}
                          cardRef={setCardRef(tour.id)}
                        />
                      ))}
                      <UnassignedPanel
                        missions={data.unassigned}
                        dayOfWeek={day}
                        onAssign={handleAssign}
                        tours={toursByDay.get(day) ?? []}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </div>
        </DndContext>
      )}

      {/* Show unassigned for days without tours */}
      {data.unassigned.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="p-4">
            <CardTitle className="text-base">
              Missions non assignées ({data.unassigned.length})
            </CardTitle>
          </CardHeader>
          <div className="px-4 pb-4 space-y-3">
            {Array.from(
              data.unassigned.reduce((acc, m) => {
                const existing = acc.get(m.dayOfWeek) ?? []
                existing.push(m)
                acc.set(m.dayOfWeek, existing)
                return acc
              }, new Map<number, UnassignedMission[]>()),
            )
              .filter(([day]) => !toursByDay.has(day))
              .sort(([a], [b]) => a - b)
              .map(([day, dayMissions]) => (
                <div key={day}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    {DAY_LABELS[day]}
                  </h4>
                  {dayMissions.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 py-1 text-sm">
                      <span className="font-mono text-muted-foreground">
                        {formatTime(m.requestedTime)}
                      </span>
                      <span>{m.missionText}</span>
                      {m.minorName && (
                        <span className="text-muted-foreground">({m.minorName})</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
