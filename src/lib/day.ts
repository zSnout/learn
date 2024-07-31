export function startOfDaySync(dayStart: number, now: number) {
  const date = new Date(now)
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(dayStart)
  let value = date.valueOf()
  if (value > now.valueOf()) {
    value -= 1000 * 60 * 60 * 24
  }
  return value
}

/** If `start` or `end` is nullish, returns `0`. */
export function daysBetweenSync(
  dayStart: number,
  start: number | null | undefined,
  end: number | null | undefined,
) {
  if (start == null || end == null) {
    return 0
  }

  const diffMs = startOfDaySync(dayStart, end) - startOfDaySync(dayStart, start)
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

/** Checks if two timestamps occurred on the same day. */
export function isSameDaySync(dayStart: number, start: number, end: number) {
  return daysBetweenSync(dayStart, start, end) == 0
}
