import { sql } from ".."
import { stmts } from "../lib/stmts"

/** Does not create a transaction. */
export function core_get() {
  return stmts.core.interpret(sql`SELECT * FROM core WHERE id = 0;`.getRow())
}
