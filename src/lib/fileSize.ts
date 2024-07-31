export function displaySize(bytes: number) {
  for (const [label, size] of [
    ["KB", 100],
    ["MB", 100_000],
    ["GB", 100_000_000],
    ["TB", 100_000_000_000],
    ["PB", 100_000_000_000_000],
  ] as const) {
    const kb = Math.round(bytes / size) / 10
    if (kb < 10) {
      return kb + " " + label
    } else if (kb < 1000) {
      return Math.round(bytes / size / 10) + " " + label
    }
  }
  return Math.round(bytes / 1_000_000_000_000_000) + " PB"
}

export function displayFileSize<T extends File | null | undefined>(
  file: T,
): T extends File ? string : T {
  if (file) {
    return displaySize(file.size) as any
  } else {
    return file as any
  }
}
