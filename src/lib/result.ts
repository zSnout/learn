export interface Ok<T> {
  readonly ok: true
  readonly value: T
}

export interface Error {
  readonly ok: false
  readonly reason: string
}

export type Result<T> = Ok<T> | Error

export function ok(): Result<undefined>
export function ok<T>(value: T): Result<T>
export function ok<T>(value?: T): Result<T> {
  return { ok: true, value: value! }
}

export function error(reason: unknown): Error {
  return {
    ok: false,
    reason: String(reason instanceof Error ? reason.message : reason),
  }
}

export function unwrap<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value
  }

  throw new Error(result.reason)
}

export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  if (result.ok) {
    return result.value
  } else {
    return defaultValue
  }
}
