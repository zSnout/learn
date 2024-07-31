export function unique<T>(item: T, index: number, array: readonly T[]) {
  return array.indexOf(item) === index
}
