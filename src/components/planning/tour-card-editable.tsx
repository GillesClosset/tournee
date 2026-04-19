'use client'

import { useSortable } from '@dnd-kit/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GripVertical, X } from 'lucide-react'
import type { TourViewData, TourStopWithRelations } from '@/types/domain'

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function SortableStopRow({
  stop,
  index,
  onRemove,
}: {
  stop: TourStopWithRelations
  index: number
  onRemove: (stopId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
    data: { type: 'stop', tourId: stop.tourId, stop },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 border-l-2 border-muted pl-3 py-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab text-muted-foreground hover:text-foreground touch-none"
        aria-label="Réordonner"
      >
        <GripVertical className="h-4 w-4" />
      </button>
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
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(stop.id)}
        aria-label="Retirer l'arrêt"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function TourCardEditable({
  tour,
  isActive,
  onSelect,
  onRemove,
  cardRef,
}: {
  tour: TourViewData
  isActive: boolean
  onSelect: () => void
  onRemove: (stopId: string) => void
  cardRef?: React.Ref<HTMLDivElement>
}) {
  const [expanded, setExpanded] = useState(false)

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `tour-drop-${tour.id}`,
    data: { type: 'tour', tourId: tour.id },
  })

  const firstStop = tour.stops[0]
  const lastStop = tour.stops[tour.stops.length - 1]
  const timeWindow =
    firstStop && lastStop
      ? `${formatTime(firstStop.scheduledTime)} → ${formatTime(lastStop.scheduledTime)}`
      : `${formatTime(tour.startTime)} → ${formatTime(tour.endTime)}`

  const stopIds = tour.stops.map((s) => s.id)

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
        <div ref={setDroppableRef} className="px-4 pb-4 pt-0 space-y-1">
          <SortableContext items={stopIds} strategy={verticalListSortingStrategy}>
            {tour.stops.map((stop, i) => (
              <SortableStopRow key={stop.id} stop={stop} index={i} onRemove={onRemove} />
            ))}
          </SortableContext>
          {tour.stops.length === 0 && (
            <p className="text-muted-foreground text-xs py-2 text-center">
              Aucun arrêt — glissez une mission ici
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
