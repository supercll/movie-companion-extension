/**
 * Parse a time string into seconds.
 * Supported formats: "1:30:05", "1:05", "65", "1:05.5", "65.5"
 */
export function parseTime(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed)
    return null

  const parts = trimmed.split(':')
  if (parts.length > 3)
    return null

  const nums = parts.map(Number)
  if (nums.some(Number.isNaN))
    return null
  if (nums.some(n => n < 0))
    return null

  if (parts.length === 3)
    return nums[0] * 3600 + nums[1] * 60 + nums[2]
  if (parts.length === 2)
    return nums[0] * 60 + nums[1]
  return nums[0]
}

export interface TimeRange {
  start: number
  end: number
}

/**
 * Parse a time range string like "1:00-1:10", "30-90", "0:30 ~ 1:30".
 * Separators: - ~ 到 至
 */
export function parseTimeRange(input: string): TimeRange | null {
  const parts = input.split(/\s*[-~到至]\s*/)
  if (parts.length !== 2)
    return null

  const start = parseTime(parts[0])
  const end = parseTime(parts[1])
  if (start === null || end === null)
    return null
  if (start >= end)
    return null

  return { start, end }
}

/**
 * Parse a comma/space separated list of time points: "0:30, 1:00, 1:30"
 */
export function parseTimePoints(input: string): number[] | null {
  const parts = input.split(/[,，\s]+/).filter(Boolean)
  if (parts.length === 0)
    return null

  const times: number[] = []
  for (const p of parts) {
    const t = parseTime(p)
    if (t === null)
      return null
    times.push(t)
  }

  return times.sort((a, b) => a - b)
}

/**
 * Detect input type and parse accordingly.
 */
export type TimedInput
  = | { type: 'point', time: number }
    | { type: 'range', start: number, end: number }
    | { type: 'points', times: number[] }

export function parseTimedInput(input: string): TimedInput | null {
  const range = parseTimeRange(input)
  if (range)
    return { type: 'range', ...range }

  if (input.includes(',') || input.includes('，')) {
    const points = parseTimePoints(input)
    if (points && points.length > 1)
      return { type: 'points', times: points }
  }

  const single = parseTime(input)
  if (single !== null)
    return { type: 'point', time: single }

  return null
}

/**
 * Format seconds to display string: "1:05" or "1:30:05"
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

  if (h > 0)
    return `${h}:${pad(m)}:${pad(s)}`
  return `${m}:${pad(s)}`
}
