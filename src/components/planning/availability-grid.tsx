'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Driver, Vehicle } from '@/lib/db/schema'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface AvailabilityCell {
  driver_id: string
  day_of_week: number
  is_available: boolean
  start_time: string
  end_time: string
  vehicle_id: string | null
}

interface ExistingAvailability {
  driverId: string
  vehicleId: string | null
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface AvailabilityGridProps {
  scheduleId: string
  drivers: Driver[]
  vehicles: Vehicle[]
  existingAvailabilities: ExistingAvailability[]
  previousScheduleId: string | null
}

function buildInitialGrid(
  driversList: Driver[],
  existing: ExistingAvailability[],
): Map<string, AvailabilityCell> {
  const grid = new Map<string, AvailabilityCell>()
  for (const driver of driversList) {
    for (let day = 1; day <= 7; day++) {
      const key = `${driver.id}-${day}`
      const ex = existing.find((a) => a.driverId === driver.id && a.dayOfWeek === day)
      grid.set(key, {
        driver_id: driver.id,
        day_of_week: day,
        is_available: ex ? ex.isAvailable : false,
        start_time: ex ? ex.startTime.slice(0, 5) : '08:00',
        end_time: ex ? ex.endTime.slice(0, 5) : '18:00',
        vehicle_id: ex ? ex.vehicleId : null,
      })
    }
  }
  return grid
}

function detectVehicleConflicts(cells: AvailabilityCell[]): Set<string> {
  const conflicts = new Set<string>()
  const active = cells.filter((c) => c.is_available && c.vehicle_id)
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]
      const b = active[j]
      if (
        a.vehicle_id === b.vehicle_id &&
        a.day_of_week === b.day_of_week &&
        a.start_time < b.end_time &&
        b.start_time < a.end_time
      ) {
        conflicts.add(`${a.driver_id}-${a.day_of_week}`)
        conflicts.add(`${b.driver_id}-${b.day_of_week}`)
      }
    }
  }
  return conflicts
}

export function AvailabilityGrid({
  scheduleId,
  drivers: driversList,
  vehicles: vehiclesList,
  existingAvailabilities,
  previousScheduleId,
}: AvailabilityGridProps) {
  const router = useRouter()
  const [grid, setGrid] = useState(() => buildInitialGrid(driversList, existingAvailabilities))
  const [saving, setSaving] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  const allCells = Array.from(grid.values())
  const conflicts = detectVehicleConflicts(allCells)

  const updateCell = useCallback((key: string, update: Partial<AvailabilityCell>) => {
    setGrid((prev) => {
      const next = new Map(prev)
      const cell = next.get(key)
      if (cell) next.set(key, { ...cell, ...update })
      return next
    })
  }, [])

  async function handleSave() {
    const activeCells = allCells.filter((c) => c.is_available)
    // Validate end > start
    for (const cell of activeCells) {
      if (cell.end_time <= cell.start_time) {
        toast.error(`Heure de fin invalide pour un chauffeur le jour ${cell.day_of_week}`)
        return
      }
    }
    if (conflicts.size > 0) {
      toast.error('Corrigez les conflits de véhicules avant de sauvegarder')
      return
    }

    setSaving(true)
    try {
      const payload = activeCells.map((c) => ({
        driver_id: c.driver_id,
        vehicle_id: c.vehicle_id,
        day_of_week: c.day_of_week,
        start_time: c.start_time,
        end_time: c.end_time,
        is_available: c.is_available,
      }))

      const res = await fetch(`/api/schedules/${scheduleId}/availabilities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(typeof err.error === 'string' ? err.error : 'Erreur serveur')
      }
      toast.success('Disponibilités enregistrées')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicate() {
    if (!previousScheduleId) return
    setDuplicating(true)
    try {
      const res = await fetch(`/api/schedules/${previousScheduleId}/availabilities`)
      if (!res.ok) throw new Error('Erreur lors de la récupération')
      const { data } = await res.json()
      const newGrid = buildInitialGrid(driversList, data)
      setGrid(newGrid)
      toast.success('Disponibilités dupliquées depuis la semaine précédente')
    } catch {
      toast.error('Erreur lors de la duplication')
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Disponibilités</h2>
        <div className="flex gap-2">
          {previousScheduleId && (
            <Button variant="outline" onClick={handleDuplicate} disabled={duplicating}>
              {duplicating ? 'Duplication...' : 'Dupliquer semaine précédente'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border p-2 text-left bg-muted">Chauffeur</th>
              {DAY_LABELS.map((label, i) => (
                <th key={i} className="border p-2 text-center bg-muted min-w-[160px]">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {driversList.map((driver) => (
              <tr key={driver.id}>
                <td className="border p-2 font-medium whitespace-nowrap">{driver.name}</td>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const key = `${driver.id}-${day}`
                  const cell = grid.get(key)!
                  const hasConflict = conflicts.has(key)
                  return (
                    <td
                      key={day}
                      className={`border p-2 ${hasConflict ? 'bg-destructive/10' : ''}`}
                    >
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={cell.is_available}
                            onChange={(e) => updateCell(key, { is_available: e.target.checked })}
                          />
                          Dispo
                        </label>
                        {cell.is_available && (
                          <>
                            <div className="flex gap-1">
                              <Input
                                type="time"
                                value={cell.start_time}
                                onChange={(e) => updateCell(key, { start_time: e.target.value })}
                                className="h-7 text-xs px-1"
                              />
                              <Input
                                type="time"
                                value={cell.end_time}
                                onChange={(e) => updateCell(key, { end_time: e.target.value })}
                                className="h-7 text-xs px-1"
                              />
                            </div>
                            <select
                              value={cell.vehicle_id ?? ''}
                              onChange={(e) =>
                                updateCell(key, {
                                  vehicle_id: e.target.value || null,
                                })
                              }
                              className="h-7 rounded border text-xs px-1 bg-transparent"
                            >
                              <option value="">Aucun véhicule</option>
                              {vehiclesList.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name} ({v.licensePlate})
                                </option>
                              ))}
                            </select>
                            {hasConflict && (
                              <Badge variant="destructive" className="text-[10px]">
                                Conflit véhicule
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
