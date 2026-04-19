import PDFDocument from 'pdfkit'
import type { ToursPageData } from '@/types/domain'
import { DAY_NAMES, formatTime, formatWeekLabel } from './helpers'

/**
 * Build a PDF buffer from tour data for a given week.
 */
export async function buildPdfBuffer(data: ToursPageData, weekStartDate: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 })

    const chunks: Uint8Array[] = []
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Title
    doc.fontSize(18).text(formatWeekLabel(weekStartDate), { align: 'center' })
    doc.moveDown(1)

    // Group tours by day
    const toursByDay = new Map<number, typeof data.tours>()
    for (const tour of data.tours) {
      const existing = toursByDay.get(tour.dayOfWeek) ?? []
      existing.push(tour)
      toursByDay.set(tour.dayOfWeek, existing)
    }

    // Column positions for stop table
    const col = { time: 60, location: 140, mission: 340, minor: 560 }

    for (let day = 1; day <= 5; day++) {
      const dayName = DAY_NAMES[day] ?? `Jour ${day}`
      const dayTours = toursByDay.get(day) ?? []

      // Check if we need a new page (leave room for at least a header + a few lines)
      if (doc.y > 440) doc.addPage()

      doc.fontSize(14).text(dayName, 40, undefined, { underline: true })
      doc.moveDown(0.3)

      if (dayTours.length === 0) {
        doc.fontSize(10).text('Aucune tournée', 60)
        doc.moveDown(0.5)
        continue
      }

      for (const tour of dayTours) {
        if (doc.y > 440) doc.addPage()

        const vehicle = tour.vehicleName
          ? `${tour.vehicleName} (${tour.vehiclePlate ?? ''})`
          : 'Pas de véhicule'

        doc
          .fontSize(11)
          .text(
            `${tour.driverName} — ${vehicle} — ${formatTime(tour.startTime)}–${formatTime(tour.endTime)}`,
            60,
          )
        doc.moveDown(0.2)

        // Table header
        const headerY = doc.y
        doc.fontSize(9)
        doc.text('Heure', col.time, headerY)
        doc.text('Lieu', col.location, headerY)
        doc.text('Mission', col.mission, headerY)
        doc.text('Enfant', col.minor, headerY)
        doc.moveDown(0.2)

        // Draw a thin line
        doc.moveTo(col.time, doc.y).lineTo(700, doc.y).lineWidth(0.5).stroke()
        doc.moveDown(0.1)

        for (const stop of tour.stops) {
          if (doc.y > 540) doc.addPage()

          const y = doc.y
          doc.fontSize(9)
          doc.text(formatTime(stop.scheduledTime), col.time, y)

          if (stop.isManualTask) {
            doc.text(stop.manualTaskText ?? '', col.location, y, { width: 400 })
          } else {
            doc.text(stop.locationName ?? '', col.location, y, { width: 190 })
            doc.text(stop.missionText ?? '', col.mission, y, { width: 210 })
            doc.text(stop.minorName ?? '', col.minor, y, { width: 140 })
          }
          doc.moveDown(0.3)
        }
        doc.moveDown(0.5)
      }
      doc.moveDown(0.3)
    }

    // Unassigned missions
    if (data.unassigned.length > 0) {
      if (doc.y > 400) doc.addPage()

      doc.fontSize(14).text('Missions non assignées', 40, undefined, { underline: true })
      doc.moveDown(0.5)

      for (const m of data.unassigned) {
        if (doc.y > 540) doc.addPage()
        const y = doc.y
        doc.fontSize(9)
        doc.text(DAY_NAMES[m.dayOfWeek] ?? '', col.time, y)
        doc.text(formatTime(m.requestedTime), col.location, y)
        doc.text(m.locationName ?? '', col.mission - 60, y, { width: 150 })
        doc.text(m.missionText, col.mission + 90, y, { width: 200 })
        doc.text(m.minorName ?? '', col.minor + 40, y, { width: 120 })
        doc.moveDown(0.3)
      }
    }

    doc.end()
  })
}
