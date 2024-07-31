import type { Id } from "@/lib/id"
import type { SqlValue } from "@sqlite.org/sqlite-wasm"

// manual argument because typescript's `x is ...` semantics are strange
export function int(value: SqlValue): value is number {
  return typeof value == "number" && Number.isSafeInteger(value)
}

export function real(value: SqlValue) {
  return typeof value == "number"
}

export function bool(value: SqlValue) {
  return value == 0 || value == 1
}

export function text(value: SqlValue) {
  return typeof value == "string"
}

export function id(value: SqlValue): value is Id {
  return typeof value == "number" && Number.isSafeInteger(value)
}

// manual argument because typescript's `x is ...` semantics are strange
export function qint(value: SqlValue): value is number | null {
  return (
    value == null || (typeof value == "number" && Number.isSafeInteger(value))
  )
}

export function qreal(value: SqlValue) {
  return value == null || typeof value == "number"
}

export function qbool(value: SqlValue) {
  return value == null || value == 0 || value == 1
}

export function qtext(value: SqlValue) {
  return value == null || typeof value == "string"
}

export function qid(value: SqlValue): value is Id {
  return (
    value == null || (typeof value == "number" && Number.isSafeInteger(value))
  )
}

export type Check = (x: SqlValue) => boolean

export type CheckResult<T extends Check> =
  T extends ((x: SqlValue) => x is infer U extends SqlValue) ? U : SqlValue

export type CheckResults<T extends readonly Check[]> = {
  [K in keyof T]: CheckResult<T[K]>
}

export type CheckResultsWithColumns<T extends readonly Check[]> = {
  columns: { [K in keyof T]: string }
  values: CheckResults<T>[]
}

export type UncheckedWithColumns = {
  columns: string[]
  values: SqlValue[][]
}
