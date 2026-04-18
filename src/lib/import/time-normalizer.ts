/**
 * Normalizes French time strings to HH:MM format.
 *
 * Supported formats: "8h", "08h30", "9H30", "15h-16h", "17h30-19h00"
 */

interface NormalizedTime {
  time: string
  timeRangeEnd: string | null
}

function parseTimePart(raw: string): string | null {
  // Match patterns like "8h", "08h30", "9H30", "17h00"
  const match = raw.trim().match(/^(\d{1,2})[hH](\d{0,2})$/)
  if (!match) return null

  const hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function normalizeTime(raw: string): NormalizedTime | null {
  if (!raw || !raw.trim()) return null

  const trimmed = raw.trim()

  // Check for range format (contains a dash between time parts)
  // Split on dash but be careful: "15h-16h", "17h30-19h00"
  const rangeParts = trimmed.split(/\s*-\s*/)

  if (rangeParts.length === 2 && /[hH]/.test(rangeParts[0]) && /[hH]/.test(rangeParts[1])) {
    const start = parseTimePart(rangeParts[0])
    const end = parseTimePart(rangeParts[1])
    if (!start || !end) return null
    return { time: start, timeRangeEnd: end }
  }

  // Single time
  const time = parseTimePart(trimmed)
  if (!time) return null
  return { time, timeRangeEnd: null }
}
