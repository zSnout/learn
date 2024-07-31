import { Id } from "./id"

export function arrayToRecord<T extends { id: Id }>(data: T[]): Record<Id, T> {
  const output = Object.create(null) as Record<Id, T>

  for (const el of data) {
    output[el.id] = el
  }

  return output
}

export function nameToRecord<T extends { name: string }>(
  data: T[],
): Record<string, T> {
  const output = Object.create(null) as Record<string, T>

  for (const el of data) {
    output[el.name] = el
  }

  return output
}

export function mapRecord<K extends keyof any, T, U>(
  data: Record<K, T>,
  fn: (value: T, key: K) => U,
): Record<K, U> {
  const output = Object.create(null) as Record<K, U>

  for (const key in data) {
    output[key] = fn(data[key], key)
  }

  return output
}

export function doublyMapRecord<
  K extends keyof any,
  T,
  K2 extends keyof any,
  T2,
>(
  data: Record<K, T>,
  k: (value: T, key: K) => K2,
  v: (value: T, key: K) => T2,
): Record<K2, T2> {
  const output = Object.create(null) as Record<K2, T2>

  for (const key in data) {
    output[k(data[key], key)] = v(data[key], key)
  }

  return output
}
