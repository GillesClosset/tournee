'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TourViewData } from '@/types/domain'

// Fix Leaflet default icon path issue with bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const TOUR_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
  '#854d0e', // amber
]

const DAY_LABELS: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
}

function createNumberedIcon(number: number, color: string, isActive: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      background: ${color};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      opacity: ${isActive ? 1 : 0.4};
    ">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function formatTime(time: string): string {
  return time.slice(0, 5)
}

interface FitBoundsProps {
  tours: TourViewData[]
}

function FitBounds({ tours }: FitBoundsProps) {
  const map = useMap()

  useEffect(() => {
    const points: L.LatLngTuple[] = []
    for (const tour of tours) {
      for (const stop of tour.stops) {
        if (stop.locationLatitude != null && stop.locationLongitude != null) {
          points.push([stop.locationLatitude, stop.locationLongitude])
        }
      }
    }
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
    }
  }, [map, tours])

  return null
}

interface TourMapProps {
  tours: TourViewData[]
  activeTourId: string | null
  onTourSelect: (id: string) => void
}

export function TourMap({ tours, activeTourId, onTourSelect }: TourMapProps) {
  const tourElements = useMemo(() => {
    return tours.map((tour, tourIndex) => {
      const color = TOUR_COLORS[tourIndex % TOUR_COLORS.length]
      const isActive = activeTourId === null || activeTourId === tour.id

      // Build positions for polyline
      const positions: L.LatLngTuple[] = []
      const stopsWithCoords = tour.stops.filter(
        (s) => s.locationLatitude != null && s.locationLongitude != null,
      )

      for (const stop of stopsWithCoords) {
        positions.push([stop.locationLatitude!, stop.locationLongitude!])
      }

      return {
        tour,
        color,
        isActive,
        positions,
        stopsWithCoords,
      }
    })
  }, [tours, activeTourId])

  // Default center (France)
  const defaultCenter: L.LatLngTuple = [46.6, 2.3]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={6}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds tours={tours} />

      {tourElements.map(({ tour, color, isActive, positions, stopsWithCoords }) => (
        <span key={tour.id}>
          {positions.length > 1 && (
            <Polyline
              positions={positions}
              pathOptions={{
                color,
                weight: isActive ? 4 : 2,
                opacity: isActive ? 0.9 : 0.25,
              }}
              eventHandlers={{ click: () => onTourSelect(tour.id) }}
            />
          )}
          {stopsWithCoords.map((stop, stopIndex) => (
            <Marker
              key={stop.id}
              position={[stop.locationLatitude!, stop.locationLongitude!]}
              icon={createNumberedIcon(stopIndex + 1, color, isActive)}
              eventHandlers={{ click: () => onTourSelect(tour.id) }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{stop.locationName ?? 'Lieu inconnu'}</p>
                  <p className="text-muted-foreground">
                    {formatTime(stop.scheduledTime)} — {tour.driverName}
                  </p>
                  <p className="text-muted-foreground">{DAY_LABELS[tour.dayOfWeek]}</p>
                  {stop.missionText && <p className="mt-1">{stop.missionText}</p>}
                  {stop.minorName && <p className="text-muted-foreground">{stop.minorName}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </span>
      ))}
    </MapContainer>
  )
}
