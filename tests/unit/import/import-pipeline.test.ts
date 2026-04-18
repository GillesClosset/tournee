import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { runImportPipeline } from '@/lib/import/import-pipeline'

function createTestExcel(data: unknown[][]): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Feuil1')
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return out
}

const locations = [
  { id: 'loc-1', name: 'Béluga' },
  { id: 'loc-2', name: 'Les Palmiers' },
]

describe('runImportPipeline', () => {
  it('parses a simple demand table', () => {
    const buffer = createTestExcel([
      ['Lundi 16-Mars', 'Béluga', '8h30', 'Jean', 'Accompagnement école', ''],
      ['', 'Les Palmiers', '9h', 'Marie', 'Retour médecin', 'urgent'],
      ['Mardi 17-Mars', 'Béluga', '14h-15h', 'Paul', 'Sortie piscine', ''],
    ])

    const result = runImportPipeline(buffer, locations)

    expect(result.errors).toHaveLength(0)
    expect(result.rows).toHaveLength(3)

    // Row 1
    expect(result.rows[0].dayOfWeek).toBe(1)
    expect(result.rows[0].locationId).toBe('loc-1')
    expect(result.rows[0].requestedTime).toBe('08:30')
    expect(result.rows[0].timeRangeEnd).toBeNull()
    expect(result.rows[0].missionType).toBe('accompagnement')
    expect(result.rows[0].accompanimentType).toBe('scolaire')
    expect(result.rows[0].isPriorityFlagged).toBe(false)

    // Row 2 (inherits day from row 1)
    expect(result.rows[1].dayOfWeek).toBe(1)
    expect(result.rows[1].locationId).toBe('loc-2')
    expect(result.rows[1].missionType).toBe('recuperation')
    expect(result.rows[1].accompanimentType).toBe('medical')
    expect(result.rows[1].isPriorityFlagged).toBe(true)

    // Row 3 (new day)
    expect(result.rows[2].dayOfWeek).toBe(2)
    expect(result.rows[2].requestedTime).toBe('14:00')
    expect(result.rows[2].timeRangeEnd).toBe('15:00')
    expect(result.rows[2].accompanimentType).toBe('loisir')
  })

  it('reports unrecognized locations as warnings', () => {
    const buffer = createTestExcel([
      ['Lundi 16-Mars', 'Lieu Inconnu', '8h', 'Jean', 'Accompagnement école', ''],
    ])

    const result = runImportPipeline(buffer, locations)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].locationId).toBeNull()
    expect(result.warnings.some((w) => w.includes('non reconnu'))).toBe(true)
  })

  it('reports errors for invalid time', () => {
    const buffer = createTestExcel([['Lundi 16-Mars', 'Béluga', 'invalid', 'Jean', 'Mission', '']])

    const result = runImportPipeline(buffer, locations)
    expect(result.rows).toHaveLength(0)
    expect(result.errors.some((e) => e.includes('heure non reconnue'))).toBe(true)
  })

  it('handles empty file', () => {
    const buffer = createTestExcel([])
    const result = runImportPipeline(buffer, locations)
    expect(result.rows).toHaveLength(0)
    expect(result.errors.some((e) => e.includes('Aucune ligne'))).toBe(true)
  })
})
