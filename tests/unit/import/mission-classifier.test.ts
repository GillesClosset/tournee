import { describe, it, expect } from 'vitest'
import { classifyMissionType, classifyAccompanimentType } from '@/lib/import/mission-classifier'

describe('classifyMissionType', () => {
  it('detects accompagnement', () => {
    expect(classifyMissionType('Accompagnement école Jean Moulin')).toBe('accompagnement')
  })

  it('detects recuperation from "retour"', () => {
    expect(classifyMissionType("Retour de l'école")).toBe('recuperation')
  })

  it('detects recuperation from "récupération"', () => {
    expect(classifyMissionType('Récupération au collège')).toBe('recuperation')
  })

  it('detects both', () => {
    expect(classifyMissionType('Accompagnement et retour école')).toBe('both')
  })

  it('defaults to accompagnement for unknown', () => {
    expect(classifyMissionType('RDV quelque part')).toBe('accompagnement')
  })
})

describe('classifyAccompanimentType', () => {
  it('detects scolaire from "école"', () => {
    expect(classifyAccompanimentType('Accompagnement école')).toBe('scolaire')
  })

  it('detects scolaire from "collège"', () => {
    expect(classifyAccompanimentType('collège Jean Moulin')).toBe('scolaire')
  })

  it('detects medical from "médecin"', () => {
    expect(classifyAccompanimentType('RDV médecin')).toBe('medical')
  })

  it('detects medical from "hôpital"', () => {
    expect(classifyAccompanimentType('Visite hôpital')).toBe('medical')
  })

  it('detects loisir from "piscine"', () => {
    expect(classifyAccompanimentType('Sortie piscine')).toBe('loisir')
  })

  it('detects famille from "parent"', () => {
    expect(classifyAccompanimentType('Visite chez le parent')).toBe('famille')
  })

  it('defaults to autre', () => {
    expect(classifyAccompanimentType('RDV tribunal')).toBe('autre')
  })

  it('handles accented text', () => {
    expect(classifyAccompanimentType('Rendez-vous médical')).toBe('medical')
  })

  it('is case-insensitive', () => {
    expect(classifyAccompanimentType('ÉCOLE PRIMAIRE')).toBe('scolaire')
  })
})
