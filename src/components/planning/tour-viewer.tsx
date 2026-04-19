'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TourMapDynamic } from '@/components/planning/tour-map-dynamic'
import type {
  ToursPageData,
  TourViewData,
  TourStopWithRelations,
  UnassignedMission,
} from '@/types/domain'

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

function StopRow({ stop, index }: { stop: TourStopWithRelations; index: number }) {
  return (
    <div className="flex items-start gap-3 border-l-2 border-muted pl-4 py-2">
      <span className="text-muted-foreground text-sm font-mono w-5 shrink-0">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{formatTime(stop.scheduledTime)}</span>
          <span className="text-sm truncate">
            {stop.isManualTask ? stop.manualTaskText : (stop.locationName ?? 'Lieu inconnu')}
          </span>
        </div>
        {!stop.isManualTask && stop.missionText && (
          <p className="text-muted-foreground text-xs mt-0.5">{stop.missionText}</p>
        )}
        {stop.minorName && <p className="text-muted-foreground text-xs">{stop.minorName}</p>}
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {stop.travelTimeMinutes > 0 && (
            <Badge variant="secondary" className="text-xs">
              🚗 {stop.travelTimeMinutes} min
            </Badge>
          )}
          {stop.parkingExtraMinutes > 0 && (
            <Badge variant="secondary" className="text-xs">
              🅿️ +{stop.parkingExtraMinutes} min
            </Badge>
          )}
          {stop.accompanimentExtraMinutes > 0 && (
            <Badge variant="secondary" className="text-xs">
              👤 +{stop.accompanimentExtraMinutes} min
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function TourCard({
  tour,
  isActive,
  onSelect,
  cardRef,
}: {
  tour: TourViewData
  isActive: boolean
  onSelect: () => void
  cardRef?: React.Ref<HTMLDivElement>
}) {
  const [expanded, setExpanded] = useState(false)
  const firstStop = tour.stops[0]
  const lastStop = tour.stops[tour.stops.length - 1]
  const timeWindow =
    firstStop && lastStop
      ? `${formatTime(firstStop.scheduledTime)} → ${formatTime(lastStop.scheduledTime)}`
      : `${formatTime(tour.startTime)} → ${formatTime(tour.endTime)}`

  return (
    <Card ref={cardRef} className={isActive ? 'ring-2 ring-primary' : ''}>
      <div
        className="cursor-pointer p-4"
        onClick={() => {
          onSelect()
          setExpanded(!expanded)
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{tour.driverName}</span>
            {tour.vehiclePlate && (
              <Badge variant="outline" className="text-xs">
                {tour.vehiclePlate}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{timeWindow}</span>
            <Badge variant="secondary">{tour.stops.length} arrêts</Badge>
            {tour.totalTravelMinutes != null && (
              <Badge variant="secondary">{tour.totalTravelMinutes} min</Badge>
            )}
            <span className="text-muted-foreground text-xs">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-1">
          {tour.stops.map((stop, i) => (
            <StopRow key={stop.id} stop={stop} index={i} />
          ))}
        </div>
      )}
    </Card>
  )
}

function UnassignedSection({ missions }: { missions: UnassignedMission[] }) {
  if (missions.length === 0) return null

  // Group by day
  const byDay = new Map<number, UnassignedMission[]>()
  for (const m of missions) {
    const existing = byDay.get(m.dayOfWeek) ?? []
    existing.push(m)
    byDay.set(m.dayOfWeek, existing)
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="p-4">
        <CardTitle className="text-base">Missions non assignées ({missions.length})</CardTitle>
      </CardHeader>
      <div className="px-4 pb-4 space-y-3">
        {Array.from(byDay.entries())
          .sort(([a], [b]) => a - b)
          .map(([day, dayMissions]) => (
            <div key={day}>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">{DAY_LABELS[day]}</h4>
              {dayMissions.map((m) => (
                <div key={m.id} className="flex items-center gap-2 py-1 text-sm">
                  <span className="font-mono text-muted-foreground">
                    {formatTime(m.requestedTime)}
                  </span>
                  <span>{m.missionText}</span>
                  {m.minorName && <span className="text-muted-foreground">({m.minorName})</span>}
                  {m.locationName && (
                    <Badge variant="outline" className="text-xs">
                      {m.locationName}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ))}
      </div>
    </Card>
  )
}

export function TourViewer({ data }: { data: ToursPageData }) {
  const [activeTourId, setActiveTourId] = useState<string | null>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

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

      {data.tours.length > 0 && (
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
                      <TourCard
                        key={tour.id}
                        tour={tour}
                        isActive={activeTourId === tour.id}
                        onSelect={() =>
                          setActiveTourId((prev) => (prev === tour.id ? null : tour.id))
                        }
                        cardRef={setCardRef(tour.id)}
                      />
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </div>
      )}

      {daysWithTours.length > 0 && data.tours.length === 0 && (
        <Tabs defaultValue={defaultDay}>
          <TabsList>
            {daysWithTours.map((day) => (
              <TabsTrigger key={day} value={day.toString()}>
                {DAY_SHORT[day]} ({toursByDay.get(day)?.length ?? 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <UnassignedSection missions={data.unassigned} />
    </div>
  )
}
