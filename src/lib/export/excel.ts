import * as XLSX from 'xlsx'
import type { ToursPageData } from '@/types/domain'
import { DAY_NAMES, formatTime, formatWeekLabel } from './helpers'

/**
 * Build an Excel buffer from tour data for a given week.
 */
export function buildExcelBuffer(data: ToursPageData, weekStartDate: string): Buffer {
  const wb = XLSX.utils.book_new()
  const rows: (string | number | null)[][] = []

  // Title
  rows.push([formatWeekLabel(weekStartDate)])
  rows.push([])

  // Group tours by day
  const toursByDay = new Map<number, typeof data.tours>()
  for (const tour of data.tours) {
    const existing = toursByDay.get(tour.dayOfWeek) ?? []
    existing.push(tour)
    toursByDay.set(tour.dayOfWeek, existing)
  }

  // Iterate days 1–5
  for (let day = 1; day <= 5; day++) {
    const dayName = DAY_NAMES[day] ?? `Jour ${day}`
    const dayTours = toursByDay.get(day) ?? []

    rows.push([dayName])
    if (dayTours.length === 0) {
      rows.push(['', 'Aucune tournée'])
      rows.push([])
      continue
    }

    for (const tour of dayTours) {
      const vehicle = tour.vehicleName
        ? `${tour.vehicleName} (${tour.vehiclePlate ?? ''})`
        : 'Pas de véhicule'
      rows.push([
        '',
        `Chauffeur: ${tour.driverName}`,
        `Véhicule: ${vehicle}`,
        `${formatTime(tour.startTime)} – ${formatTime(tour.endTime)}`,
      ])

      // Stop header
      rows.push(['', 'Heure', 'Lieu', 'Mission', 'Enfant'])

      for (const stop of tour.stops) {
        if (stop.isManualTask) {
          rows.push(['', formatTime(stop.scheduledTime), '', stop.manualTaskText ?? '', ''])
        } else {
          rows.push([
            '',
            formatTime(stop.scheduledTime),
            stop.locationName ?? '',
            stop.missionText ?? '',
            stop.minorName ?? '',
          ])
        }
      }
      rows.push([])
    }
  }

  // Unassigned missions
  if (data.unassigned.length > 0) {
    rows.push([])
    rows.push(['Missions non assignées'])
    rows.push(['', 'Jour', 'Heure', 'Lieu', 'Mission', 'Enfant'])
    for (const m of data.unassigned) {
      rows.push([
        '',
        DAY_NAMES[m.dayOfWeek] ?? '',
        formatTime(m.requestedTime),
        m.locationName ?? '',
        m.missionText,
        m.minorName ?? '',
      ])
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  ws['!cols'] = [{ wch: 4 }, { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Planning')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return buf
}
