/**
 * Classifies mission type and accompaniment type from French text.
 */

/** Strip accents for comparison */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function classifyMissionType(text: string): 'accompagnement' | 'recuperation' | 'both' {
  const n = normalize(text)

  const hasAccomp =
    n.includes('accompagnement') ||
    n.includes('accompagner') ||
    n.includes('amener') ||
    n.includes('conduire')
  const hasRecup =
    n.includes('recuperation') ||
    n.includes('raccompagnement') ||
    n.includes('retour') ||
    n.includes('ramener') ||
    n.includes('recuperer')

  if (hasAccomp && hasRecup) return 'both'
  if (hasRecup) return 'recuperation'
  return 'accompagnement'
}

export function classifyAccompanimentType(
  text: string,
): 'scolaire' | 'medical' | 'loisir' | 'famille' | 'autre' {
  const n = normalize(text)

  if (
    n.includes('scolaire') ||
    n.includes('ecole') ||
    n.includes('college') ||
    n.includes('lycee') ||
    n.includes('classe') ||
    n.includes('cours')
  ) {
    return 'scolaire'
  }

  if (
    n.includes('medical') ||
    n.includes('medecin') ||
    n.includes('hopital') ||
    n.includes('clinique') ||
    n.includes('docteur') ||
    n.includes('sante') ||
    n.includes('rdv medical') ||
    n.includes('consultation')
  ) {
    return 'medical'
  }

  if (
    n.includes('loisir') ||
    n.includes('sport') ||
    n.includes('piscine') ||
    n.includes('activite') ||
    n.includes('jeu') ||
    n.includes('sortie')
  ) {
    return 'loisir'
  }

  if (
    n.includes('famille') ||
    n.includes('parent') ||
    n.includes('mere') ||
    n.includes('pere') ||
    n.includes('visite familiale') ||
    n.includes('droit de visite')
  ) {
    return 'famille'
  }

  return 'autre'
}
