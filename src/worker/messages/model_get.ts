import type { Id } from "@/lib/id"
import { sql } from ".."
import { stmts } from "../lib/stmts"

/** Does not create a transaction */
export function model_get(mid: Id) {
  return stmts.models.interpret(
    sql`SELECT * FROM models WHERE id = ${mid};`.getRow(),
  )
}
