export function compare(a: string, b: string) {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()

  if (al < bl) return -1
  if (al > bl) return 1
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function compareWithName(a: { name: string }, b: { name: string }) {
  return compare(a.name, b.name)
}
