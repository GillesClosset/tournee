/**
 * Import pipeline orchestrator.
 * Combines all parsing/classification functions into a single pipeline.
 */

import { parseExcelBuffer } from './excel-parser'
import { normalizeTime } from './time-normalizer'
import { parseDayOfWeek } from './day-parser'
import { classifyMissionType, classifyAccompanimentType } from './mission-classifier'
import { matchLocation } from './location-matcher'
import type { ImportResult, ImportedMission } from '@/lib/validators/import.schema'

interface LocationEntry {
  id: string
  name: string
}

const PRIORITY_KEYWORDS = ['urgent', 'prioritaire', 'priorité', 'impératif', 'imperatif']

function detectPriority(observations: string): boolean {
  if (!observations) return false
  const lower = observations.toLowerCase()
  return PRIORITY_KEYWORDS.some((kw) => lower.includes(kw))
}

export function runImportPipeline(buffer: ArrayBuffer, locations: LocationEntry[]): ImportResult {
  const warnings: string[] = []
  const errors: string[] = []
  const rows: ImportedMission[] = []

  let rawRows
  try {
    rawRows = parseExcelBuffer(buffer)
  } catch (e) {
    errors.push(`Erreur de lecture du fichier Excel: ${e instanceof Error ? e.message : String(e)}`)
    return { rows: [], warnings, errors }
  }

  if (rawRows.length === 0) {
    errors.push('Aucune ligne de données trouvée dans le fichier Excel')
    return { rows: [], warnings, errors }
  }

  for (const raw of rawRows) {
    const rowLabel = `Ligne ${raw.rowIndex}`

    // Day
    const dayOfWeek = parseDayOfWeek(raw.day)
    if (!dayOfWeek) {
      errors.push(`${rowLabel}: jour non reconnu "${raw.day}"`)
      continue
    }

    // Time
    const normalizedTime = normalizeTime(raw.time)
    if (!normalizedTime) {
      errors.push(`${rowLabel}: heure non reconnue "${raw.time}"`)
      continue
    }

    // Mission text is required
    const missionText = raw.missionText || raw.location
    if (!missionText) {
      errors.push(`${rowLabel}: texte de mission manquant`)
      continue
    }

    // Location matching
    let locationId: string | null = null
    if (raw.location) {
      const match = matchLocation(raw.location, locations)
      if (match) {
        locationId = match.locationId
        if (match.confidence < 0.8) {
          warnings.push(
            `${rowLabel}: lieu "${raw.location}" associé avec confiance ${Math.round(match.confidence * 100)}%`,
          )
        }
      } else {
        warnings.push(`${rowLabel}: lieu non reconnu "${raw.location}"`)
      }
    }

    // Mission classification
    const missionType = classifyMissionType(missionText)
    const accompanimentType = classifyAccompanimentType(missionText)

    // Priority
    const isPriorityFlagged = detectPriority(raw.observations)

    rows.push({
      dayOfWeek,
      locationId,
      requestedTime: normalizedTime.time,
      timeRangeEnd: normalizedTime.timeRangeEnd,
      minorName: raw.minorName || null,
      missionText,
      missionType,
      accompanimentType,
      isPriorityFlagged,
      observations: raw.observations || null,
      rawRowData: raw.rawValues,
    })
  }

  return { rows, warnings, errors }
}
