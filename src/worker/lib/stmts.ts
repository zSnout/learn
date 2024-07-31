import { sql } from ".."
import { createStmts } from "./createStmts"

export type INTEGER = number
export type REAL = number
export type BOOLEAN = number
export type TEXT = string

export const stmts = createStmts((strings, ...bindings) =>
  sql(strings, ...bindings),
)
