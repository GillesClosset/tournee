/**
 * Parses an Excel buffer (xlsx) and extracts raw row data.
 * Targets the first sheet ("Feuil1" or index 0).
 */

import * as XLSX from 'xlsx'

export interface RawExcelRow {
  /** Column A: day/date text */
  day: string
  /** Column B: location/origin */
  location: string
  /** Column C: time */
  time: string
  /** Column D: minor name */
  minorName: string
  /** Column E: mission text */
  missionText: string
  /** Column F: observations */
  observations: string
  /** Original row data for rawRowData storage */
  rawValues: unknown[]
  /** Row index in the spreadsheet (1-based) */
  rowIndex: number
}

export function parseExcelBuffer(buffer: ArrayBuffer): RawExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })

  // Target "Feuil1" or first sheet
  const sheetName = workbook.SheetNames.includes('Feuil1') ? 'Feuil1' : workbook.SheetNames[0]

  if (!sheetName) return []

  const sheet = workbook.Sheets[sheetName]
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  const rows: RawExcelRow[] = []
  let currentDay = ''

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i]
    if (!row || row.length === 0) continue

    const colA = String(row[0] ?? '').trim()
    const colB = String(row[1] ?? '').trim()
    const colC = String(row[2] ?? '').trim()
    const colD = String(row[3] ?? '').trim()
    const colE = String(row[4] ?? '').trim()
    const colF = String(row[5] ?? '').trim()

    // If column A has text, it might be a day header or a data row
    if (colA) {
      currentDay = colA
    }

    // A row is considered a data row if it has at least a time (col C) or mission text (col E)
    if (!colC && !colE) continue

    rows.push({
      day: currentDay || colA,
      location: colB,
      time: colC,
      minorName: colD,
      missionText: colE,
      observations: colF,
      rawValues: [...row],
      rowIndex: i + 1, // 1-based
    })
  }

  return rows
}
